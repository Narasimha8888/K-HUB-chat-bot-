import pytest
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.prompt_engine import PromptEngine

def test_build_quiz_prompt_no_context():
    prompt = PromptEngine.build_quiz_prompt(
        topic="Photosynthesis",
        quiz_type="Multiple Choice",
        difficulty="Easy",
        count=5
    )
    assert "Topic: Photosynthesis" in prompt
    assert "Quiz Type: Multiple Choice" in prompt
    assert "Difficulty: Easy" in prompt
    assert "Questions: 5" in prompt
    assert "RAG Context" not in prompt

def test_build_quiz_prompt_with_context():
    prompt = PromptEngine.build_quiz_prompt(
        topic="Photosynthesis",
        quiz_type="Multiple Choice",
        difficulty="Easy",
        count=5,
        context="Plants use sunlight."
    )
    assert "RAG Context available:\nPlants use sunlight." in prompt

def test_parse_quiz_valid_json():
    response = '```json\n{"topic": "Test", "questions": []}\n```'
    parsed = PromptEngine.parse_quiz(response)
    assert parsed["topic"] == "Test"
    assert parsed["questions"] == []

def test_parse_quiz_invalid_json():
    response = "This is not json"
    parsed = PromptEngine.parse_quiz(response)
    assert "error" in parsed

def test_build_notes_prompt():
    raw_text = "mitochondria power house"
    prompt = PromptEngine.build_notes_prompt(raw_text)
    assert "mitochondria power house" in prompt
    assert "Context to include" not in prompt
