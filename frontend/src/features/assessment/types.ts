import { z } from "zod";

const optionSchema = z.union([
  z.string().min(1),
  z.object({ label: z.string().min(1), value: z.string().min(1) }),
]);

export const questionSchema = z
  .object({
    id: z.union([z.string().min(1), z.number()]),
    type: z.enum(["mcq", "short_answer", "scenario"]),
    question: z.string().min(1),
    options: z.array(optionSchema).optional(),
  })
  .refine((question) => question.type !== "mcq" || (question.options?.length ?? 0) > 0, {
    message: "Multiple-choice questions must include options.",
  });

export const questionsSchema = z
  .array(questionSchema)
  .length(3)
  .refine(
    (questions) =>
      new Set(questions.map((question) => String(question.id))).size === 3 &&
      new Set(questions.map((question) => question.type)).size === 3,
    { message: "Expected three distinct questions: mcq, short_answer, and scenario." },
  );

const scoreSchema = z.number().min(0).max(100);
export const resultSchema = z.object({
  overall_score: scoreSchema,
  authenticity_score: scoreSchema,
  integrity_status: z.string().min(1),
  paste_count: z.number().int().nonnegative(),
  tab_switch_count: z.number().int().nonnegative().optional(),
  detected_phrases: z.array(z.string()),
  deductions: z.object({
    initial_score: scoreSchema,
    phrase_deduction: z.number().nonnegative(),
    paste_deduction: z.number().nonnegative(),
    final_score: scoreSchema,
  }),
});

export type Question = z.infer<typeof questionSchema>;
export type AssessmentResult = z.infer<typeof resultSchema>;
export type Answers = Record<string, string>;
export interface Submission {
  answers: Answers;
  paste_count: number;
  tab_switch_count?: number;
}

export function getUnanswered(questions: Question[], answers: Answers): string[] {
  return questions
    .filter((question) => !answers[String(question.id)]?.trim())
    .map((question) => String(question.id));
}

export function blockPaste(event: { preventDefault: () => void }, onAttempt: () => void) {
  event.preventDefault();
  onAttempt();
}
