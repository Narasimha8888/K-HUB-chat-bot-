import json
import httpx
from core.config import get_settings

settings = get_settings()

class OllamaClient:
    def __init__(self, base_url: str = settings.OLLAMA_BASE_URL, model: str = settings.OLLAMA_MODEL):
        self.base_url = base_url
        self.model = model

    async def stream_chat(self, messages: list[dict]):
        """
        Streams a chat response from Ollama.
        Messages should be in the format: [{"role": "user", "content": "..."}]
        """
        url = f"{self.base_url}/api/chat"
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": True,
            "options": {
                "num_ctx": 4096  # Limit context window to prevent out-of-memory errors on local machines
            }
        }

        async with httpx.AsyncClient() as client:
            async with client.stream("POST", url, json=payload, timeout=None) as response:
                if response.status_code != 200:
                    yield f"data: {json.dumps({'error': f'Ollama error: {response.status_code}'})}\n\n"
                    return

                async for line in response.aiter_lines():
                    if line:
                        try:
                            data = json.loads(line)
                            # Yield SSE formatted data
                            yield f"data: {json.dumps(data)}\n\n"
                        except json.JSONDecodeError:
                            continue

    async def generate(self, prompt: str, system: str = "") -> str:
        """
        Generates a full text response from Ollama (non-streaming).
        Useful for generating structured data like JSON.
        """
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system,
            "stream": False,
            "options": {
                "num_ctx": 4096
            }
        }
        
        # Disable timeout for long generation tasks like flashcards
        async with httpx.AsyncClient(timeout=None) as client:
            response = await client.post(url, json=payload)
            if response.status_code != 200:
                raise Exception(f"Ollama error: {response.status_code} - {response.text}")
            
            data = response.json()
            return data.get("response", "")
