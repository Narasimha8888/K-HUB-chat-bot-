from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from services.ollama_client import OllamaClient
from services.rag_service import RAGService
from services.prompt_engine import PromptEngine
from db.session import get_db
from db.models import FlashcardSet, Flashcard

router = APIRouter()
rag_service = RAGService()

class FlashcardRequest(BaseModel):
    topic: str
    num_cards: int = 5

@router.post("/", tags=["Flashcards"])
async def generate_flashcards(request: FlashcardRequest, db: Session = Depends(get_db)):
    if not request.topic.strip():
        raise HTTPException(status_code=400, detail="Topic is required")

    # 1. Query RAG context
    context = rag_service.query_context(request.topic, n_results=3)

    # 2. Build prompt
    prompt = PromptEngine.build_flashcard_prompt(request.topic, context, request.num_cards)
    system = PromptEngine.FLASHCARD_SYSTEM_PROMPT

    # 3. Generate using Ollama
    ollama = OllamaClient()
    try:
        response_text = await ollama.generate(prompt=prompt, system=system)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate flashcards: {str(e)}")

    # 4. Parse JSON
    cards = PromptEngine.parse_flashcards(response_text)
    
    # Fallback if parsing failed
    if not cards:
        cards = [{"question": f"What are the main concepts of {request.topic}?", "answer": "Unable to generate specific flashcards. Please try another topic."}]

    # 5. Save to Database
    new_set = FlashcardSet(topic=request.topic)
    db.add(new_set)
    db.commit()
    db.refresh(new_set)

    for card in cards:
        db_card = Flashcard(
            set_id=new_set.id,
            front=card.get("question", ""),
            back=card.get("answer", "")
        )
        db.add(db_card)
    db.commit()

    return {"id": new_set.id, "topic": new_set.topic, "cards": cards}

@router.get("/{set_id}", tags=["Flashcards"])
def get_flashcard_set(set_id: int, db: Session = Depends(get_db)):
    fc_set = db.query(FlashcardSet).filter(FlashcardSet.id == set_id).first()
    if not fc_set:
        raise HTTPException(status_code=404, detail="Flashcard set not found")
    
    cards = [{"question": c.front, "answer": c.back} for c in fc_set.cards]
    return {"id": fc_set.id, "topic": fc_set.topic, "cards": cards}
