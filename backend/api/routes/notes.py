from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
import json
from services.ollama_client import OllamaClient
from services.rag_service import RAGService
from services.prompt_engine import PromptEngine
from db.session import get_db
from db.models import SmartNote

router = APIRouter()
rag_service = RAGService()

class NotesRequest(BaseModel):
    raw_text: str

@router.post("/", tags=["Notes"])
async def enhance_notes(request: NotesRequest, db: Session = Depends(get_db)):
    if not request.raw_text.strip():
        raise HTTPException(status_code=400, detail="Raw text is required")

    # 1. Query RAG context using the raw text as the search query
    context = rag_service.query_context(request.raw_text, n_results=3)

    # 2. Build prompt
    prompt = PromptEngine.build_notes_prompt(request.raw_text, context)
    system = PromptEngine.NOTES_SYSTEM_PROMPT

    # 3. Stream from Ollama
    ollama = OllamaClient()
    
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": prompt}
    ]

    async def event_generator():
        topic = request.raw_text[:50] + "..." if len(request.raw_text) > 50 else request.raw_text
        note = SmartNote(topic=topic, content="")
        db.add(note)
        db.commit()
        db.refresh(note)

        full_content = ""
        async for chunk in ollama.stream_chat(messages):
            if chunk.startswith("data: "):
                try:
                    data_str = chunk[6:].strip()
                    if data_str:
                        data = json.loads(data_str)
                        if "message" in data and "content" in data["message"]:
                            full_content += data["message"]["content"]
                except Exception:
                    pass
            yield chunk

        note.content = full_content
        db.commit()
        
        yield f"data: {json.dumps({'done': True, 'note_id': note.id})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/{note_id}", tags=["Notes"])
def get_note(note_id: int, db: Session = Depends(get_db)):
    note = db.query(SmartNote).filter(SmartNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return {"id": note.id, "topic": note.topic, "content": note.content}
