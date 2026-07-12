import os
import chromadb
from chromadb.config import Settings
from typing import List

class RAGService:
    def __init__(self):
        # Initialize local ChromaDB client in backend/chroma_db
        persist_directory = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db")
        os.makedirs(persist_directory, exist_ok=True)
        self.client = chromadb.PersistentClient(path=persist_directory, settings=Settings(anonymized_telemetry=False))
        
        # Use default collection and default sentence-transformers embedding
        self.collection = self.client.get_or_create_collection(name="studymode_docs")

    def add_document(self, doc_id: str, chunks: List[str]):
        """Embeds and stores text chunks into ChromaDB."""
        if not chunks:
            return
            
        ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
        metadatas = [{"doc_id": doc_id, "chunk_index": i} for i in range(len(chunks))]
        
        # Upsert automatically embeds the chunks using the default embedding model
        self.collection.upsert(
            documents=chunks,
            ids=ids,
            metadatas=metadatas
        )

    def delete_document(self, doc_id: str):
        """Deletes all chunks associated with a document ID from ChromaDB."""
        self.collection.delete(where={"doc_id": doc_id})

    def query_context(self, query: str, n_results: int = 3, distance_threshold: float = 1.2) -> str:
        """Queries the vector database for the most relevant chunks."""
        # Check if the collection is empty before querying
        if self.collection.count() == 0:
            return ""
            
        results = self.collection.query(
            query_texts=[query],
            n_results=min(n_results, self.collection.count())
        )
        
        if not results["documents"] or not results["documents"][0]:
            return ""
            
        # Filter chunks by distance threshold (closer to 0 is better, > 1.2 is usually unrelated)
        context_chunks = []
        for i, doc in enumerate(results["documents"][0]):
            distance = results["distances"][0][i]
            if distance < distance_threshold:
                context_chunks.append(doc)
                
        if not context_chunks:
            return ""
            
        # Combine the top chunks into a single context string
        return "\n\n".join(context_chunks)
