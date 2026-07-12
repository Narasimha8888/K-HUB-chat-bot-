import asyncio
from services.ollama_client import OllamaClient

topic = 'give me quiz on python'

validation_prompt = (
    f"You are a strict academic filter. Analyze the user request below.\n"
    f"1. Identify the core subject matter, ignoring conversational words like 'give me a quiz on' or 'create flashcards for'.\n"
    f"2. Determine if the core subject is a serious academic subject, field of study, technology, science, history, or professional skill.\n"
    f"3. Determine if it is purely entertainment, pop culture, anime, movies, sports, or gossip.\n"
    f"4. Finally, on a new line, output exactly 'RESULT: YES' if it is academic/professional, or 'RESULT: NO' if it is entertainment/non-educational.\n\n"
    f"User Request: '{topic}'\n"
)

async def run():
    client = OllamaClient()
    response = await client.generate(prompt=validation_prompt)
    print('RESPONSE:', response)

asyncio.run(run())
