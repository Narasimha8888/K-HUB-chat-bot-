from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
import json
from services.ollama_client import OllamaClient
from services.prompt_engine import PromptEngine
from db.session import get_db
from db.models import Quiz, Question

router = APIRouter()

class QuizRequest(BaseModel):
    topic: str
    quiz_type: str = "Multiple Choice Questions (MCQ)"
    difficulty: str = "Medium"
    total_questions: int = 5

@router.post("/", tags=["Quiz"])
async def generate_quiz(request: QuizRequest, db: Session = Depends(get_db)):
    if not request.topic.strip():
        raise HTTPException(status_code=400, detail="Topic is required")

    # 1. Validation Layer
    from services.validation_service import validate_educational_topic
    is_educational = await validate_educational_topic(request.topic)
    if not is_educational:
        refusal_msg = "Studymode AI only generates quizzes for educational topics. Please enter an education-related topic."
        new_quiz = Quiz(topic=request.topic, error=refusal_msg)
        db.add(new_quiz)
        db.commit()
        db.refresh(new_quiz)
        raise HTTPException(status_code=400, detail={"message": refusal_msg, "id": new_quiz.id})

    # 2. Build prompt
    prompt = PromptEngine.build_quiz_prompt(
        topic=request.topic,
        quiz_type=request.quiz_type,
        difficulty=request.difficulty,
        count=request.total_questions,
        context=""
    )
    system = PromptEngine.QUIZ_SYSTEM_PROMPT

    # 3. Generate using Ollama
    ollama = OllamaClient()
    try:
        response_text = await ollama.generate(prompt=prompt, system=system)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {str(e)}")

    # 4. Parse JSON
    quiz_data = PromptEngine.parse_quiz(response_text)
    
    if "error" in quiz_data:
        raise HTTPException(status_code=400, detail=quiz_data["error"])

    # 5. Save to Database
    new_quiz = Quiz(topic=request.topic)
    db.add(new_quiz)
    db.commit()
    db.refresh(new_quiz)

    for q in quiz_data.get("questions", []):
        db_q = Question(
            quiz_id=new_quiz.id,
            question_text=q.get("question", ""),
            options=json.dumps(q.get("options", [])),
            correct_answer=q.get("answer", q.get("correct_answer", "")),
            explanation=q.get("explanation", "")
        )
        db.add(db_q)
    db.commit()

    # Re-fetch to get IDs
    db.refresh(new_quiz)
    questions = []
    for q in new_quiz.questions:
        try:
            options = json.loads(q.options)
        except:
            options = []
        questions.append({
            "id": q.id,
            "question": q.question_text,
            "options": options,
            "answer": q.correct_answer,
            "explanation": q.explanation,
            "user_answer": q.user_answer
        })

    return {"id": new_quiz.id, "topic": new_quiz.topic, "is_submitted": new_quiz.is_submitted, "questions": questions}

@router.get("/{quiz_id}", tags=["Quiz"])
def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    questions = []
    for q in quiz.questions:
        try:
            options = json.loads(q.options)
        except:
            options = []
        questions.append({
            "id": q.id,
            "question": q.question_text,
            "options": options,
            "answer": q.correct_answer,
            "explanation": q.explanation,
            "user_answer": q.user_answer
        })
        
    return {"id": quiz.id, "topic": quiz.topic, "is_submitted": quiz.is_submitted, "questions": questions, "error": quiz.error}

class QuizSubmitRequest(BaseModel):
    answers: dict # { question_id: "selected option" }

@router.post("/{quiz_id}/submit", tags=["Quiz"])
def submit_quiz(quiz_id: int, request: QuizSubmitRequest, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    for q in quiz.questions:
        if str(q.id) in request.answers:
            q.user_answer = request.answers[str(q.id)]
    
    quiz.is_submitted = 1
    db.commit()
    return {"status": "success"}
