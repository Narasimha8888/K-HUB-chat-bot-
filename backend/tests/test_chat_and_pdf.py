from io import BytesIO

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_chat_endpoint_returns_study_response():
    response = client.post(
        "/api/v1/chat/",
        json={"message": "Explain photosynthesis in simple terms"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert "answer" in payload
    assert len(payload["answer"]) > 0


def test_pdf_upload_endpoint_accepts_pdf():
    pdf_bytes = b"%PDF-1.4\n%example\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"
    response = client.post(
        "/api/v1/pdf/upload",
        files={"file": ("notes.pdf", BytesIO(pdf_bytes), "application/pdf")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["filename"] == "notes.pdf"
