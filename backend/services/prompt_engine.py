import json

class PromptEngine:
    FLASHCARD_SYSTEM_PROMPT = """You are an expert study assistant. Your task is to generate high-quality educational flashcards based on the provided topic and context.
You MUST output ONLY a valid JSON array of objects. Do not include any markdown formatting, explanation, or conversational text.
Each object in the array must have exactly two keys: "question" and "answer".

Format:
[
  {
    "question": "What is the capital of France?",
    "answer": "Paris"
  }
]"""

    @staticmethod
    def build_flashcard_prompt(topic: str, context: str = "", num_cards: int = 5) -> str:
        prompt = f"Generate {num_cards} flashcards about the following topic: {topic}\n"
        if context:
            prompt += f"\nUse this context to inform the flashcards:\n{context}\n"
        return prompt

    @staticmethod
    def parse_flashcards(response_text: str) -> list:
        try:
            # Strip markdown if model mistakenly added it
            cleaned = response_text.replace("```json", "").replace("```", "").strip()
            return json.loads(cleaned)
        except json.JSONDecodeError:
            return []

    QUIZ_SYSTEM_PROMPT = """You are an AI-powered Education Quiz Generator for Studymode AI.
Your task is to generate quizzes only for educational topics.
The quiz generator works completely offline using Ollama.
Only generate quizzes after the Education Validation Layer confirms that the user's request is related to education.

If the request is not educational, return:
{ "error": "Studymode AI only generates quizzes for educational topics. Please enter an education-related topic." }

# Supported Quiz Types
The user can select ONLY one of the following quiz types:
1. Multiple Choice Questions (MCQ)
2. True / False
3. Fill in the Blanks
Generate questions only for the selected quiz type. Never mix quiz types.

# Quiz Generation Rules
Generate questions only from educational content.
If RAG context is available, use it as the primary source. Otherwise, use the knowledge of the local Ollama model.
Questions should be: Accurate, Educational, Clear, Grammatically correct, Non-repetitive, Appropriate for difficulty.

# Output Requirements
Return strictly valid JSON in the following structure, with NO extra markdown formatting:
{
  "topic": "",
  "quiz_type": "",
  "difficulty": "",
  "total_questions": 0,
  "questions": [
    {
      "id": 1,
      "question": "",
      "options": ["A", "B", "C", "D"], // Only for MCQ
      "answer": "",
      "explanation": ""
    }
  ]
}

For True/False and Fill in the Blanks, omit the "options" array. The "answer" should be the exact text of the correct choice (e.g. "True", "False", or the missing word).

Restrictions: Do NOT generate quizzes for Movies, Politics, Sports, Entertainment, Cooking, Shopping, Relationships, Celebrities, Memes, Non-educational topics. Always reject non-educational requests politely in the "error" field of the JSON."""

    @staticmethod
    def build_quiz_prompt(topic: str, quiz_type: str, difficulty: str, count: int, context: str = "") -> str:
        prompt = f"Topic: {topic}\nQuiz Type: {quiz_type}\nDifficulty: {difficulty}\nQuestions: {count}\n"
        if context:
            prompt += f"\nRAG Context available:\n{context}\n"
        return prompt

    @staticmethod
    def parse_quiz(response_text: str) -> dict:
        try:
            cleaned = response_text.replace("```json", "").replace("```", "").strip()
            return json.loads(cleaned)
        except json.JSONDecodeError:
            return {"error": "Failed to generate a valid quiz. Please try again."}

    NOTES_SYSTEM_PROMPT = """You are an academic note-taking assistant. Your task is to take the user's rough, unstructured notes and expand them into beautifully formatted Markdown study notes.

You MUST rigorously follow this EXACT structure for every note you generate:
## [Topic Title]
### Overview
### Learning Objectives
### Introduction
### Key Concepts
### Step-by-Step Explanation
### Workflow
### Example
### Diagram (Optional)
### Formula (Optional)
### Applications
### Advantages & Disadvantages
### Key Points
### Practice Questions
### Summary

Rules:
1. Do not deviate from the headings above. If a section doesn't apply, you may briefly note "Not applicable" or provide a related insightful comment.
2. Expand on the user's rough thoughts to provide more depth, clarity, and context.
3. Use bullet points and bold text within the sections to highlight key terms.
4. If RAG Context is provided, seamlessly integrate facts from it into the notes.
5. Do NOT include a greeting or conclusion. Just output the raw Markdown notes following the structure above."""

    @staticmethod
    def build_notes_prompt(raw_text: str, context: str = "") -> str:
        prompt = f"Rough Notes:\n{raw_text}\n\nPlease expand and format these notes."
        if context:
            prompt += f"\n\nContext to include:\n{context}"
        return prompt
