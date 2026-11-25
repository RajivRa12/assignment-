import { questionsSchema, resultSchema, type Submission } from "./types";

export function getMockQuestions() {
  return questionsSchema.parse([
    {
      id: "1",
      type: "mcq",
      question:
        "Which mechanism allows Transformer neural networks to dynamically identify relationships and weigh the importance of different tokens in an input sequence?",
      options: [
        "A. Convolutional feature pooling",
        "B. Multi-head self-attention",
        "C. Recurrent hidden-state propagation",
        "D. Gradient descent momentum",
      ],
    },
    {
      id: "2",
      type: "short_answer",
      question:
        "What is hallucination in Large Language Models (LLMs), and how does Retrieval-Augmented Generation (RAG) help reduce hallucinations?",
    },
    {
      id: "3",
      type: "scenario",
      question:
        "You are developing an enterprise AI customer-support chatbot using an LLM. How would you implement security guardrails to prevent prompt injection attacks and protect sensitive customer information?",
    },
  ]);
}

export function getMockResult(submission: Submission) {
  return resultSchema.parse({
    overall_score: 70,
    authenticity_score: 70,
    integrity_status: "Flagged",
    paste_count: submission.paste_count,
    tab_switch_count: submission.tab_switch_count,
    detected_phrases: ["furthermore"],
    deductions: {
      initial_score: 100,
      phrase_deduction: 15,
      paste_deduction: 15,
      final_score: 70,
    },
  });
}
