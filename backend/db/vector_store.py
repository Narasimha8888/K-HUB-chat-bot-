import chromadb
from chromadb.config import Settings

# Persistent local ChromaDB
client = chromadb.PersistentClient(path="./chroma_db")

# Create or get collections
def get_document_collection():
    return client.get_or_create_collection(name="documents")

def get_flashcard_collection():
    return client.get_or_create_collection(name="flashcards")

def get_quiz_collection():
    return client.get_or_create_collection(name="quizzes")
