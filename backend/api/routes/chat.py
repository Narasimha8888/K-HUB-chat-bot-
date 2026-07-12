import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from db.session import get_db
from pydantic import BaseModel
from typing import Optional
from crud.chat import create_chat_session, get_session_messages, add_message
from services.ollama_client import OllamaClient

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[int] = None

@router.post("/", tags=["Chat"])
async def ai_chat(request: ChatRequest, db: Session = Depends(get_db)):
    session_id = request.session_id
    
    # Create a new session if none provided
    if not session_id:
        chat_session = create_chat_session(db, title=request.message[:50])
        session_id = chat_session.id

    # Save user message
    add_message(db, session_id=session_id, role="user", content=request.message)

    # Retrieve history for context
    history = get_session_messages(db, session_id=session_id, limit=20)
    messages = [{"role": msg.role, "content": msg.content} for msg in history]

    # Initialize RAG and query relevant chunks
    from services.rag_service import RAGService
    rag = RAGService()
    rag_context = rag.query_context(request.message)

    chat_system_prompt = "You are an intelligent academic AI assistant. Always format your responses beautifully using Markdown. Use clear headings (###), bullet points, and bold text to structure your answers logically and make them easy to read. Avoid giant walls of text."

    if rag_context:
        # Prepend a system message with context if we found some
        system_prompt = f"{chat_system_prompt}\n\nUse the following study materials to answer the user's question. If the answer is not in the context, use your general knowledge.\n\nContext:\n{rag_context}"
        messages.insert(0, {"role": "system", "content": system_prompt})
    else:
        messages.insert(0, {"role": "system", "content": chat_system_prompt})

    # Initialize client
    client = OllamaClient()

    async def event_generator():
        full_response = ""
        # We need to stream the chunks and also accumulate them to save to DB at the end
        async for chunk in client.stream_chat(messages):
            # chunk is of format "data: {...}\n\n"
            if chunk.startswith("data: "):
                try:
                    data_str = chunk[6:].strip()
                    if data_str:
                        data = json.loads(data_str)
                        if "message" in data and "content" in data["message"]:
                            full_response += data["message"]["content"]
                except Exception:
                    pass
            yield chunk
        
        # After stream finishes, save assistant message
        if full_response:
            add_message(db, session_id=session_id, role="assistant", content=full_response)
            
        # Send a special final event with the session_id so frontend knows it
        yield f"data: {json.dumps({'done': True, 'session_id': session_id})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/{session_id}/messages", tags=["Chat"])
def get_chat_messages(session_id: int, db: Session = Depends(get_db)):
    history = get_session_messages(db, session_id=session_id, limit=100)
    messages = [{"id": msg.id, "role": msg.role, "content": msg.content} for msg in history]
    return {"session_id": session_id, "messages": messages}
