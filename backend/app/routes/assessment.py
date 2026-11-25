from fastapi import APIRouter, HTTPException, status
from app.schemas.assessment import (
    QuestionsResponse,
    Question,
    QuestionType,
    SubmissionRequest,
    AssessmentResultResponse,
)
from app.services.evaluation import evaluate_submission

router = APIRouter(prefix="/api/v1/assessment", tags=["assessment"])

MOCK_QUESTIONS = [
    Question(
        id="1",
        type=QuestionType.MCQ,
        question="Which mechanism allows Transformer neural networks to dynamically identify relationships and weigh the importance of different tokens in an input sequence?",
        options=[
            "A. Convolutional feature pooling",
            "B. Multi-head self-attention",
            "C. Recurrent hidden-state propagation",
            "D. Gradient descent momentum",
        ],
    ),
    Question(
        id="2",
        type=QuestionType.SHORT_ANSWER,
        question="What is hallucination in Large Language Models (LLMs), and how does Retrieval-Augmented Generation (RAG) help reduce hallucinations?",
    ),
    Question(
        id="3",
        type=QuestionType.SCENARIO,
        question="You are developing an enterprise AI customer-support chatbot using an LLM. How would you implement security guardrails to prevent prompt injection attacks and protect sensitive customer information?",
    ),
]


@router.get("/questions", response_model=QuestionsResponse, response_model_exclude_none=True)
async def get_questions() -> QuestionsResponse:
    return QuestionsResponse(questions=MOCK_QUESTIONS)


@router.post("/submit", response_model=AssessmentResultResponse)
async def submit_assessment(submission: SubmissionRequest) -> AssessmentResultResponse:
    try:
        return evaluate_submission(
            submission.answers, submission.paste_count, submission.tab_switch_count or 0
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during evaluation.",
        ) from exc
