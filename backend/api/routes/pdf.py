import uuid
from fastapi import APIRouter, File, HTTPException, UploadFile, Depends
from sqlalchemy.orm import Session
from services.upload_service import UploadService
from services.pdf_service import PDFService
from services.rag_service import RAGService
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
        
        # 2. Extract text and chunk it
        text = PDFService.extract_text(file_path)
        chunks = PDFService.chunk_text(text)
        
        # 3. Store in DB
        db_doc = Document(filename=file.filename, file_path=file_path)
        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)

        # 4. Store in ChromaDB
        doc_id = str(uuid.uuid4())
        rag_service.add_document(doc_id, chunks)
        
        # 4. Generate summary
        from services.ollama_client import OllamaClient
        ollama = OllamaClient()
        
        # Take up to 3000 chars for the summary prompt to avoid OOM or slow generation
        summary_prompt = f"Please provide a concise, 2-sentence summary of the following document:\n\n{text[:3000]}"
        
        try:
            summary = await ollama.generate(prompt=summary_prompt)
        except Exception as e:
            summary = f"Successfully parsed {file.filename} into {len(chunks)} chunks and stored for RAG."

        return {"success": True, "filename": file.filename, "summary": summary.strip(), "doc_id": doc_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
