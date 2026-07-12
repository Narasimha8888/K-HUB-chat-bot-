from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from db.session import get_db
from db.models import ChatSession, FlashcardSet, Quiz, SmartNote, Document

router = APIRouter()

@router.get("/", tags=["History"])
def get_history(db: Session = Depends(get_db)):
    history = []
    
    # Get Chats
    chats = db.query(ChatSession).order_by(desc(ChatSession.created_at)).limit(20).all()
    for c in chats:
        history.append({
            "id": c.id,
            "title": c.title or "New Chat",
            "type": "chat",
            "path": f"/chat?session_id={c.id}",
            "created_at": c.created_at
        })
        
    # Get Flashcards
    flashcards = db.query(FlashcardSet).order_by(desc(FlashcardSet.created_at)).limit(20).all()
    for f in flashcards:
        history.append({
            "id": f.id,
            "title": f.topic,
            "type": "flashcards",
            "path": f"/flashcards?id={f.id}",
            "created_at": f.created_at
        })
        
    # Get Quizzes
    quizzes = db.query(Quiz).order_by(desc(Quiz.created_at)).limit(20).all()
    for q in quizzes:
        history.append({
            "id": q.id,
            "title": q.topic,
            "type": "quiz",
            "path": f"/quiz?id={q.id}",
            "created_at": q.created_at
        })
        
    # Get Notes
    notes = db.query(SmartNote).order_by(desc(SmartNote.created_at)).limit(20).all()
    for n in notes:
        history.append({
            "id": n.id,
            "title": n.topic,
            "type": "smart-notes",
            "path": f"/smart-notes?id={n.id}",
            "created_at": n.created_at
        })

    # Get PDFs
    pdfs = db.query(Document).order_by(desc(Document.uploaded_at)).limit(20).all()
    for p in pdfs:
        history.append({
            "id": p.id,
            "title": p.filename,
            "type": "pdf-summarizer",
            "path": f"/pdf-summarizer?id={p.id}",
            "created_at": p.uploaded_at
        })

    # Sort unified history by created_at descending
    history.sort(key=lambda x: x["created_at"] if x["created_at"] else 0, reverse=True)
    
    # Return top 30 recents overall
    return history[:30]

@router.delete("/{item_type}/{item_id}", tags=["History"])
def delete_history_item(item_type: str, item_id: int, db: Session = Depends(get_db)):
    if item_type == "chat":
        item = db.query(ChatSession).filter(ChatSession.id == item_id).first()
    elif item_type == "flashcards":
        item = db.query(FlashcardSet).filter(FlashcardSet.id == item_id).first()
    elif item_type == "quiz":
        item = db.query(Quiz).filter(Quiz.id == item_id).first()
    elif item_type == "smart-notes":
        item = db.query(SmartNote).filter(SmartNote.id == item_id).first()
    elif item_type == "pdf-summarizer":
        item = db.query(Document).filter(Document.id == item_id).first()
    else:
        return {"error": "Invalid item type"}

    if item:
        db.delete(item)
        db.commit()
        return {"success": True}
    return {"error": "Item not found"}
