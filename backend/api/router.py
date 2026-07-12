from fastapi import APIRouter
from .routes import health, chat, pdf, flashcards, quiz, notes, history

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health")
api_router.include_router(chat.router, prefix="/chat")
api_router.include_router(pdf.router, prefix="/pdf")
api_router.include_router(flashcards.router, prefix="/flashcards")
api_router.include_router(quiz.router, prefix="/quiz")
api_router.include_router(notes.router, prefix="/notes")
api_router.include_router(history.router, prefix="/history")
