import fitz  # PyMuPDF
import re
from typing import List

class PDFService:
    @staticmethod
    def extract_text(file_path: str) -> str:
        """Extract all text from a PDF document."""
        text = ""
        try:
            with fitz.open(file_path) as doc:
                for page in doc:
                    text += page.get_text() + "\n"
            return text
        except Exception as e:
            raise Exception(f"Failed to read PDF: {str(e)}")

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """
        Splits text into chunks with a sliding window overlap.
        Cleans up excessive whitespace before chunking.
        """
        # Clean text
        text = re.sub(r'\s+', ' ', text).strip()
        
        words = text.split(' ')
        chunks = []
        i = 0
        while i < len(words):
            chunk = ' '.join(words[i:i + chunk_size])
            chunks.append(chunk)
            i += chunk_size - overlap
            
        return chunks
