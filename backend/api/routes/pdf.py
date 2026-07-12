import uuid
from fastapi import APIRouter, File, HTTPException, UploadFile, Depends
from sqlalchemy.orm import Session
from services.upload_service import UploadService
from services.pdf_service import PDFService
from services.rag_service import RAGService
from services.validation_service import validate_educational_topic
from db.session import get_db
from db.models import Document

router = APIRouter()
rag_service = RAGService()

@router.post("/upload", tags=["PDF"])
async def upload_pdf(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=415, detail="Only PDF files are allowed")

    try:
        # 1. Save file locally
        file_path = await UploadService.save_pdf(file)
        
        # 2. Extract text
        text = PDFService.extract_text(file_path)
        
        # 3. Validate if the content is educational
        is_educational = await validate_educational_topic(text[:3000])
        
        if not is_educational:
            summary = "Studymode AI only summarizes for educational topics. Please upload an education-related pdf."
            db_doc = Document(filename=file.filename, file_path=file_path, summary=summary)
            db.add(db_doc)
            db.commit()
            db.refresh(db_doc)
            return {"success": True, "filename": file.filename, "summary": summary, "doc_id": str(db_doc.id)}
            
        # 4. If educational, chunk and store
        chunks = PDFService.chunk_text(text)
        
        db_doc = Document(filename=file.filename, file_path=file_path)
        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)

        doc_id = str(db_doc.id)
        rag_service.add_document(doc_id, chunks)
        
        # 5. Generate summary
        from services.ollama_client import OllamaClient
        ollama = OllamaClient()
        
        summary_prompt = f"Please provide a concise, 2-sentence summary of the following document:\n\n{text[:3000]}"
        
        try:
            summary = await ollama.generate(prompt=summary_prompt)
            summary = summary.strip()
        except Exception as e:
            summary = f"Successfully parsed {file.filename} into {len(chunks)} chunks and stored for RAG."
            
        db_doc.summary = summary
        db.commit()

        return {"success": True, "filename": file.filename, "summary": summary, "doc_id": doc_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", tags=["PDF"])
def get_documents(db: Session = Depends(get_db)):
    docs = db.query(Document).order_by(Document.uploaded_at.desc()).all()
    return [{"id": d.id, "filename": d.filename, "summary": d.summary, "created_at": d.uploaded_at} for d in docs]

@router.delete("/{doc_id}", tags=["PDF"])
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    import os
    if doc.file_path and os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception as e:
            pass # Continue even if file delete fails
            
    rag_service.delete_document(str(doc.id))
    db.delete(doc)
    db.commit()
    
    return {"success": True}
