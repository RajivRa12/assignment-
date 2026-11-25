from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, StrictInt, field_validator, model_serializer


class QuestionType(str, Enum):
    MCQ = "mcq"
    SHORT_ANSWER = "short_answer"
    SCENARIO = "scenario"


class Question(BaseModel):
    id: str
    type: QuestionType
    question: str
    options: Optional[List[str]] = None

    @model_serializer(mode="wrap")
    def serialize_model(self, handler):
        data = handler(self)
        if data.get("options") is None:
            data.pop("options", None)
        return data


class QuestionsResponse(BaseModel):
    questions: List[Question]


class SubmissionRequest(BaseModel):
    answers: Dict[str, str] = Field(..., description="Mapping of question IDs to answers")
    paste_count: StrictInt = Field(..., ge=0, description="Total number of detected paste attempts")
    tab_switch_count: Optional[StrictInt] = Field(
        default=0, ge=0, description="Total number of detected window or tab switch attempts"
    )

    model_config = ConfigDict(extra="forbid")

    @field_validator("answers")
    @classmethod
    def validate_answers(cls, v: Dict[str, str]) -> Dict[str, str]:
        required_ids = {"1", "2", "3"}
        missing_ids = required_ids - set(v.keys())
        if missing_ids:
            raise ValueError(f"Missing required question answers: {sorted(list(missing_ids))}")

        extra_ids = set(v.keys()) - required_ids
        if extra_ids:
            raise ValueError(f"Invalid question IDs provided: {sorted(list(extra_ids))}")

        for q_id, answer in v.items():
            if not isinstance(answer, str) or not answer.strip():
                raise ValueError(f"Answer for question '{q_id}' cannot be empty or whitespace only.")

        return v


class Deductions(BaseModel):
    initial_score: int
    phrase_deduction: int
    paste_deduction: int
    final_score: int


class AssessmentResultResponse(BaseModel):
    overall_score: int
    authenticity_score: int
    integrity_status: str
    paste_count: int
    tab_switch_count: Optional[int] = None
    detected_phrases: List[str]
    deductions: Deductions

    @model_serializer(mode="wrap")
    def serialize_model(self, handler):
        data = handler(self)
        if data.get("tab_switch_count") is None:
            data.pop("tab_switch_count", None)
        return data
