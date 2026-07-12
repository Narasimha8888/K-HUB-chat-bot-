from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from services.ollama_client import OllamaClient
from services.prompt_engine import PromptEngine
from db.session import get_db
from db.models import FlashcardSet, Flashcard

router = APIRouter()

class FlashcardRequest(BaseModel):
    topic: str
    num_cards: int = 5

@router.post("/", tags=["Flashcards"])
async def generate_flashcards(request: FlashcardRequest, db: Session = Depends(get_db)):
    if not request.topic.strip():
        raise HTTPException(status_code=400, detail="Topic is required")

    # 1. Validation Layer
    from services.validation_service import validate_educational_topic
    is_educational = await validate_educational_topic(request.topic)
    if not is_educational:
        refusal_msg = "Studymode AI only generates flashcards for educational topics. Please enter an education-related topic."
        new_set = FlashcardSet(topic=request.topic, error=refusal_msg)
        db.add(new_set)
        db.commit()
        db.refresh(new_set)
        raise HTTPException(status_code=400, detail={"message": refusal_msg, "id": new_set.id})

    # 2. Build prompt
    prompt = PromptEngine.build_flashcard_prompt(request.topic, "", request.num_cards)
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
    
    cards = [{"id": c.id, "question": c.front, "answer": c.back, "status": c.status, "is_bookmarked": bool(c.is_bookmarked)} for c in fc_set.cards]
    return {"id": fc_set.id, "topic": fc_set.topic, "cards": cards, "error": fc_set.error}

class FeedbackRequest(BaseModel):
    status: str = None
    is_bookmarked: bool = None

@router.put("/card/{card_id}/feedback", tags=["Flashcards"])
def update_flashcard_feedback(card_id: int, request: FeedbackRequest, db: Session = Depends(get_db)):
    card = db.query(Flashcard).filter(Flashcard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    
    if request.status is not None:
        card.status = request.status
    if request.is_bookmarked is not None:
        card.is_bookmarked = 1 if request.is_bookmarked else 0
        
    db.commit()
    return {"success": True, "status": card.status, "is_bookmarked": bool(card.is_bookmarked)}
