from sqlalchemy.orm import Session
from db.models import ChatSession, ChatMessage

def create_chat_session(db: Session, title: str = "New Chat"):
    db_session = ChatSession(title=title)
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def get_chat_session(db: Session, session_id: int):
    return db.query(ChatSession).filter(ChatSession.id == session_id).first()

def add_message(db: Session, session_id: int, role: str, content: str):
    message = ChatMessage(session_id=session_id, role=role, content=content)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message

def get_session_messages(db: Session, session_id: int, limit: int = 50):
    return db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).limit(limit).all()
