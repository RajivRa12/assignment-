from typing import Dict, List
from app.schemas.assessment import AssessmentResultResponse, Deductions

SUSPICIOUS_PHRASES = [
    "in conclusion",
    "furthermore",
    "pivotal role",
]


def detect_suspicious_phrases(text: str) -> List[str]:
    lower_text = text.lower()
    detected = []
    for phrase in SUSPICIOUS_PHRASES:
        if phrase in lower_text:
            detected.append(phrase)
    return detected


def evaluate_submission(
    answers: Dict[str, str], paste_count: int, tab_switch_count: int = 0
) -> AssessmentResultResponse:
    initial_score = 100

    short_answer_text = answers.get("2", "")
    detected_phrases = detect_suspicious_phrases(short_answer_text)

    phrase_deduction = 15 if len(detected_phrases) > 0 else 0
    paste_deduction = 15 if paste_count > 0 else 0

    total_deduction = phrase_deduction + paste_deduction
    final_score = max(0, min(100, initial_score - total_deduction))

    if phrase_deduction > 0 or paste_deduction > 0 or tab_switch_count > 0:
        integrity_status = "Flagged"
    else:
        integrity_status = "Verified Human"

    deductions = Deductions(
        initial_score=initial_score,
        phrase_deduction=phrase_deduction,
        paste_deduction=paste_deduction,
        final_score=final_score,
    )

    return AssessmentResultResponse(
        overall_score=final_score,
        authenticity_score=final_score,
        integrity_status=integrity_status,
        paste_count=paste_count,
        tab_switch_count=tab_switch_count if tab_switch_count > 0 else None,
        detected_phrases=detected_phrases,
        deductions=deductions,
    )
