import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.routes.assessment import MOCK_QUESTIONS

client = TestClient(app)


def test_1_get_questions_returns_exactly_three_questions():
    response = client.get("/api/v1/assessment/questions")
    assert response.status_code == 200
    data = response.json()
    assert "questions" in data
    assert len(data["questions"]) == 3

    q1 = next(q for q in data["questions"] if q["id"] == "1")
    assert q1["type"] == "mcq"
    assert (
        q1["question"]
        == "Which mechanism allows Transformer neural networks to dynamically identify relationships and weigh the importance of different tokens in an input sequence?"
    )
    assert q1["options"] == [
        "A. Convolutional feature pooling",
        "B. Multi-head self-attention",
        "C. Recurrent hidden-state propagation",
        "D. Gradient descent momentum",
    ]

    q2 = next(q for q in data["questions"] if q["id"] == "2")
    assert q2["type"] == "short_answer"
    assert (
        q2["question"]
        == "What is hallucination in Large Language Models (LLMs), and how does Retrieval-Augmented Generation (RAG) help reduce hallucinations?"
    )
    assert "options" not in q2

    q3 = next(q for q in data["questions"] if q["id"] == "3")
    assert q3["type"] == "scenario"
    assert (
        q3["question"]
        == "You are developing an enterprise AI customer-support chatbot using an LLM. How would you implement security guardrails to prevent prompt injection attacks and protect sensitive customer information?"
    )
    assert "options" not in q3


def test_2_all_three_question_types_are_present():
    response = client.get("/api/v1/assessment/questions")
    assert response.status_code == 200
    questions = response.json()["questions"]
    types = {q["type"] for q in questions}
    assert types == {"mcq", "short_answer", "scenario"}


def test_3_question_ids_are_unique():
    response = client.get("/api/v1/assessment/questions")
    assert response.status_code == 200
    questions = response.json()["questions"]
    ids = [q["id"] for q in questions]
    assert len(ids) == len(set(ids))
    assert set(ids) == {"1", "2", "3"}


def test_4_valid_submission_without_flags_returns_100():
    payload = {
        "answers": {
            "1": "B. Multi-head self-attention",
            "2": "Hallucination occurs when an LLM produces incorrect assertions not backed by data. RAG reduces hallucinations by injecting verified knowledge into the context window.",
            "3": "Implement strict input sanitization, delineate system instructions from user queries, and deploy output filters for private data.",
        },
        "paste_count": 0,
    }
    response = client.post("/api/v1/assessment/submit", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["overall_score"] == 100
    assert data["authenticity_score"] == 100
    assert data["integrity_status"] == "Verified Human"
    assert data["paste_count"] == 0
    assert data["detected_phrases"] == []
    assert data["deductions"] == {
        "initial_score": 100,
        "phrase_deduction": 0,
        "paste_deduction": 0,
        "final_score": 100,
    }


def test_5_suspicious_phrase_detection_deducts_15_points():
    payload = {
        "answers": {
            "1": "B. Multi-head self-attention",
            "2": "Hallucination is a model risk. Furthermore, RAG grounds the model in authoritative documents.",
            "3": "Use prompt delimiters and PII redaction.",
        },
        "paste_count": 0,
    }
    response = client.post("/api/v1/assessment/submit", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["overall_score"] == 85
    assert data["authenticity_score"] == 85
    assert data["integrity_status"] == "Flagged"
    assert data["paste_count"] == 0
    assert "furthermore" in data["detected_phrases"]
    assert data["deductions"]["phrase_deduction"] == 15
    assert data["deductions"]["paste_deduction"] == 0
    assert data["deductions"]["final_score"] == 85


def test_6_paste_attempts_deduct_15_points():
    payload = {
        "answers": {
            "1": "B. Multi-head self-attention",
            "2": "RAG retrieves relevant domain context to minimize incorrect answers.",
            "3": "Use prompt delimiters and PII redaction.",
        },
        "paste_count": 1,
    }
    response = client.post("/api/v1/assessment/submit", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["overall_score"] == 85
    assert data["authenticity_score"] == 85
    assert data["integrity_status"] == "Flagged"
    assert data["paste_count"] == 1
    assert data["detected_phrases"] == []
    assert data["deductions"]["phrase_deduction"] == 0
    assert data["deductions"]["paste_deduction"] == 15
    assert data["deductions"]["final_score"] == 85


def test_7_both_conditions_deduct_30_points():
    payload = {
        "answers": {
            "1": "B. Multi-head self-attention",
            "2": "In conclusion, RAG provides relevant context to reduce false claims.",
            "3": "Use prompt delimiters and PII redaction.",
        },
        "paste_count": 2,
    }
    response = client.post("/api/v1/assessment/submit", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["overall_score"] == 70
    assert data["authenticity_score"] == 70
    assert data["integrity_status"] == "Flagged"
    assert data["paste_count"] == 2
    assert "in conclusion" in data["detected_phrases"]
    assert data["deductions"]["phrase_deduction"] == 15
    assert data["deductions"]["paste_deduction"] == 15
    assert data["deductions"]["final_score"] == 70


def test_8_multiple_suspicious_phrases_only_deduct_15_once():
    payload = {
        "answers": {
            "1": "B. Multi-head self-attention",
            "2": "In conclusion, RAG plays a pivotal role in grounding models. Furthermore, it prevents hallucinations.",
            "3": "Use prompt delimiters and PII redaction.",
        },
        "paste_count": 0,
    }
    response = client.post("/api/v1/assessment/submit", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert len(data["detected_phrases"]) == 3
    assert set(data["detected_phrases"]) == {"in conclusion", "furthermore", "pivotal role"}
    assert data["deductions"]["phrase_deduction"] == 15
    assert data["overall_score"] == 85


def test_9_multiple_paste_attempts_only_deduct_15_once():
    payload = {
        "answers": {
            "1": "B. An architectural style for communication between systems",
            "2": "APIs allow applications to talk to one another directly.",
            "3": "Apply unique index.",
        },
        "paste_count": 10,
    }
    response = client.post("/api/v1/assessment/submit", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["paste_count"] == 10
    assert data["deductions"]["paste_deduction"] == 15
    assert data["overall_score"] == 85


def test_10_integrity_status_is_correct():
    clean_payload = {
        "answers": {
            "1": "B. An architectural style for communication between systems",
            "2": "A clean response with no suspicious phrases.",
            "3": "Scenario response.",
        },
        "paste_count": 0,
    }
    res_clean = client.post("/api/v1/assessment/submit", json=clean_payload)
    assert res_clean.json()["integrity_status"] == "Verified Human"

    flagged_phrase = {
        "answers": {
            "1": "B. An architectural style for communication between systems",
            "2": "This has a pivotal role in systems.",
            "3": "Scenario response.",
        },
        "paste_count": 0,
    }
    res_phrase = client.post("/api/v1/assessment/submit", json=flagged_phrase)
    assert res_phrase.json()["integrity_status"] == "Flagged"

    flagged_paste = {
        "answers": {
            "1": "B. An architectural style for communication between systems",
            "2": "Clean response.",
            "3": "Scenario response.",
        },
        "paste_count": 1,
    }
    res_paste = client.post("/api/v1/assessment/submit", json=flagged_paste)
    assert res_paste.json()["integrity_status"] == "Flagged"


def test_11_negative_paste_count_is_rejected():
    payload = {
        "answers": {
            "1": "B. An architectural style for communication between systems",
            "2": "Clean response.",
            "3": "Scenario response.",
        },
        "paste_count": -1,
    }
    response = client.post("/api/v1/assessment/submit", json=payload)
    assert response.status_code == 422


def test_12_missing_answers_are_rejected():
    payload = {
        "answers": {
            "1": "Only question 1 answered",
        },
        "paste_count": 0,
    }
    response = client.post("/api/v1/assessment/submit", json=payload)
    assert response.status_code == 422
    assert "Missing required question answers" in response.json()["detail"]


def test_13_invalid_question_ids_are_rejected():
    payload = {
        "answers": {
            "1": "Valid",
            "2": "Valid",
            "3": "Valid",
            "unknown_id": "Extra answer",
        },
        "paste_count": 0,
    }
    response = client.post("/api/v1/assessment/submit", json=payload)
    assert response.status_code == 422
    assert "Invalid question IDs" in response.json()["detail"]


def test_boolean_paste_count_is_rejected():
    payload = {
        "answers": {
            "1": "Valid",
            "2": "Valid",
            "3": "Valid",
        },
        "paste_count": True,
    }
    response = client.post("/api/v1/assessment/submit", json=payload)
    assert response.status_code == 422


def test_empty_string_answer_is_rejected():
    payload = {
        "answers": {
            "1": "Valid",
            "2": "   ",
            "3": "Valid",
        },
        "paste_count": 0,
    }
    response = client.post("/api/v1/assessment/submit", json=payload)
    assert response.status_code == 422
    assert "cannot be empty" in response.json()["detail"]


def test_cors_preflight_options():
    response = client.options(
        "/api/v1/assessment/submit",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_case_insensitive_suspicious_phrases():
    payload = {
        "answers": {
            "1": "B. An architectural style for communication between systems",
            "2": "FURTHERMORE, THIS PLAYS A PIVOTAL ROLE IN MODERN ARCHITECTURES.",
            "3": "Use unique DB constraints.",
        },
        "paste_count": 0,
    }
    response = client.post("/api/v1/assessment/submit", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["overall_score"] == 85
    assert set(data["detected_phrases"]) == {"furthermore", "pivotal role"}


def test_large_paste_count_deducts_only_15():
    payload = {
        "answers": {
            "1": "B. An architectural style for communication between systems",
            "2": "Clean response.",
            "3": "Clean response.",
        },
        "paste_count": 500,
    }
    response = client.post("/api/v1/assessment/submit", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["paste_count"] == 500
    assert data["deductions"]["paste_deduction"] == 15
    assert data["overall_score"] == 85


def test_non_dict_answers_rejected():
    response = client.post(
        "/api/v1/assessment/submit",
        json={"answers": ["A", "B", "C"], "paste_count": 0},
    )
    assert response.status_code == 422


def test_null_answer_rejected():
    response = client.post(
        "/api/v1/assessment/submit",
        json={"answers": {"1": "A", "2": None, "3": "C"}, "paste_count": 0},
    )
    assert response.status_code == 422


def test_missing_body_rejected():
    response = client.post("/api/v1/assessment/submit")
    assert response.status_code == 422


def test_tab_switch_flags_submission():
    payload = {
        "answers": {
            "1": "B. Multi-head self-attention",
            "2": "Clean response without AI phrases.",
            "3": "Scenario response.",
        },
        "paste_count": 0,
        "tab_switch_count": 2,
    }
    response = client.post("/api/v1/assessment/submit", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["tab_switch_count"] == 2
    assert data["integrity_status"] == "Flagged"


def test_frontend_mock_questions_match_backend_questions():
    mock_file = Path(__file__).resolve().parent.parent.parent / "frontend" / "src" / "features" / "assessment" / "mock-data.ts"
    assert mock_file.exists(), f"Frontend mock file not found at {mock_file}"
    content = mock_file.read_text(encoding="utf-8")

    response = client.get("/api/v1/assessment/questions")
    assert response.status_code == 200
    questions = response.json()["questions"]

    for q in questions:
        assert q["question"] in content, f"Question text for ID {q['id']} missing from frontend mock-data.ts"
        if "options" in q:
            for opt in q["options"]:
                assert opt in content, f"Option '{opt}' missing from frontend mock-data.ts"



