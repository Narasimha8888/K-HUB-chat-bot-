import os
from fastapi import UploadFile

UPLOAD_DIR = "uploads/pdfs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class UploadService:
    @staticmethod
    async def save_pdf(file: UploadFile) -> str:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
        return file_path
