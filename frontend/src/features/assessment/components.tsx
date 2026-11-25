"use client";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ClipboardX,
  FileText,
  ListChecks,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { blockPaste, type Question } from "./types";

export function AssessmentHeader() {
  return (
    <header className="portal-header">
      <div className="portal-container flex h-full items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="portal-logo">
            <ClipboardCheck size={23} strokeWidth={1.8} />
          </div>
          <span className="text-lg font-bold sm:text-xl">Assessment Portal</span>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <ShieldCheck size={14} />
          <span className="hidden sm:inline">AI Engineering Assessment</span>
          <span className="sm:hidden">Assessment</span>
        </div>
      </div>
    </header>
  );
}

export function ProgressIndicator({ step }: { step: 1 | 2 }) {
  return (
    <nav
      aria-label="Assessment progress"
      className="flex items-center justify-between border-b border-border py-6 sm:py-7"
    >
      <ol className="flex items-center gap-3 sm:gap-5">
        <li className="flex items-center gap-2.5">
          <span className="step-number" data-active={step === 1} data-complete={step === 2}>
            {step === 2 ? <Check size={14} /> : "1"}
          </span>
          <span
            className={`text-sm font-semibold ${step === 1 ? "text-foreground" : "text-muted-foreground"}`}
          >
            Assessment
          </span>
        </li>
        <ChevronRight size={15} className="text-muted-foreground/60" />
        <li className="flex items-center gap-2.5">
          <span className="step-number" data-active={step === 2}>
            2
          </span>
          <span
            className={`text-sm font-semibold ${step === 2 ? "text-foreground" : "text-muted-foreground"}`}
          >
            Results
          </span>
        </li>
      </ol>
      <span className="text-xs text-muted-foreground">Step {step} of 2</span>
    </nav>
  );
}

export function PasteWarningBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span
      role="status"
      className="inline-flex items-center gap-1.5 rounded-md bg-warning-soft px-2.5 py-1.5 text-xs font-medium text-warning"
    >
      <ClipboardX size={13} />
      {count} paste {count === 1 ? "attempt" : "attempts"} detected
    </span>
  );
}

export function TabSwitchWarningBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span
      role="status"
      className="inline-flex items-center gap-1.5 rounded-md bg-warning-soft px-2.5 py-1.5 text-xs font-medium text-warning"
    >
      <TriangleAlert size={13} />
      {count} window switch {count === 1 ? "attempt" : "attempts"} detected
    </span>
  );
}

interface AnswerProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
  onPasteAttempt: () => void;
  invalid: boolean;
  disabled: boolean;
}

export function MCQQuestion({ question, value, onChange, disabled, invalid }: AnswerProps) {
  return (
    <RadioGroup
      id={`answer-${question.id}`}
      aria-labelledby={`title-${question.id}`}
      aria-invalid={invalid}
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      className="gap-2.5"
    >
      {question.options?.map((option, index) => {
        const optionValue = typeof option === "string" ? option : option.value;
        const label = typeof option === "string" ? option : option.label;
        const id = `option-${question.id}-${index}`;
        return (
          <label key={id} htmlFor={id} className="question-option text-sm">
            <RadioGroupItem value={optionValue} id={id} />
            <span>
              {/^[A-Z][.)]\s/.test(label) ? label : `${String.fromCharCode(65 + index)}. ${label}`}
            </span>
          </label>
        );
      })}
    </RadioGroup>
  );
}

export function TextAnswerQuestion({
  question,
  value,
  onChange,
  onPasteAttempt,
  invalid,
  disabled,
}: AnswerProps) {
  return (
    <div>
      <Textarea
        id={`answer-${question.id}`}
        aria-labelledby={`title-${question.id}`}
        aria-invalid={invalid}
        aria-describedby={invalid ? `error-${question.id}` : undefined}
        className="answer-field"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onPaste={(event) => blockPaste(event, onPasteAttempt)}
        placeholder={
          question.type === "scenario" ? "Explain your approach..." : "Type your answer here..."
        }
        disabled={disabled}
      />
      <div className="mt-2.5 flex justify-between gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <LockKeyhole size={12} />
          Manual input only
        </span>
        <span>{value.length} characters</span>
      </div>
    </div>
  );
}

const typeLabels = {
  mcq: "Multiple choice",
  short_answer: "Short answer",
  scenario: "Scenario reasoning",
};
export function QuestionCard(props: AnswerProps & { number: number }) {
  const { question, number, invalid, value } = props;
  return (
    <section
      id={`question-${question.id}`}
      aria-labelledby={`title-${question.id}`}
      className="question-card p-5 sm:p-7"
      data-invalid={invalid}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-muted-foreground">
            QUESTION {String(number).padStart(2, "0")}
          </span>
          <span className="rounded bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
            {typeLabels[question.type]}
          </span>
        </div>
        {value.trim() ? (
          <CheckCircle2 size={17} className="shrink-0 text-success" aria-label="Answered" />
        ) : (
          <span className="text-[11px] text-muted-foreground">Required</span>
        )}
      </div>
      <h2
        id={`title-${question.id}`}
        className="mb-5 text-base font-semibold leading-relaxed sm:text-[17px]"
      >
        {question.question}
      </h2>
      {question.type === "mcq" ? <MCQQuestion {...props} /> : <TextAnswerQuestion {...props} />}
      {invalid && (
        <p id={`error-${question.id}`} className="mt-3 text-xs text-destructive">
          Please {question.type === "mcq" ? "select an option" : "enter your answer"}.
        </p>
      )}
    </section>
  );
}

export function AssessmentOverview({
  total,
  completed,
  answered,
  pasteCount,
  tabSwitchCount = 0,
  loading,
  reviewing,
}: {
  total: number;
  completed: number;
  answered: boolean[];
  pasteCount: number;
  tabSwitchCount?: number;
  loading: boolean;
  reviewing: boolean;
}) {
  return (
    <aside className="space-y-7 lg:sticky lg:top-8 lg:self-start">
      <section className="border-b border-border pb-6">
        <div className="mb-5 flex items-center gap-2">
          <ListChecks size={18} className="text-primary" />
          <h2 className="text-sm font-semibold">Assessment overview</h2>
        </div>
        <dl className="space-y-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Questions</dt>
            <dd className="font-medium">{loading ? "—" : total || "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Assessment type</dt>
            <dd className="font-medium">Technical</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Status</dt>
            <dd
              className={`inline-flex items-center gap-1.5 text-xs font-medium ${reviewing ? "text-success" : "text-primary"}`}
            >
              <span className="status-dot" />
              {reviewing ? "Submitted" : total ? "In progress" : "Not started"}
            </dd>
          </div>
        </dl>
      </section>
      <section>
        <div className="mb-3 flex justify-between text-xs">
          <span className="font-semibold">Your progress</span>
          <span className="text-muted-foreground">
            {completed} of {total || 3} answered
          </span>
        </div>
        <Progress value={total ? (completed / total) * 100 : 0} aria-label="Questions answered" />
        <div className="mt-4 flex gap-2">
          {[1, 2, 3].map((number) => (
            <span
              key={number}
              className={`flex h-8 w-8 items-center justify-center rounded-md border text-xs font-medium ${answered[number - 1] ? "border-primary/20 bg-accent text-primary" : "border-border bg-card text-muted-foreground"}`}
            >
              {answered[number - 1] ? <Check size={13} /> : String(number).padStart(2, "0")}
            </span>
          ))}
        </div>
      </section>
      <section className="border-t border-border pt-6">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck size={18} className="text-primary" />
          Assessment integrity
        </div>
        <p className="text-xs leading-6 text-muted-foreground">
          Pasting is disabled. Please type your answers manually.
        </p>
        <div
          className={`mt-4 flex items-center gap-2 text-xs ${pasteCount ? "text-warning" : "text-muted-foreground"}`}
        >
          {pasteCount ? <TriangleAlert size={14} /> : <ClipboardCheck size={14} />}
          {pasteCount} paste {pasteCount === 1 ? "attempt" : "attempts"}
        </div>
        {tabSwitchCount > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xs text-warning">
            <TriangleAlert size={14} />
            {tabSwitchCount} window switch {tabSwitchCount === 1 ? "attempt" : "attempts"}
          </div>
        )}
      </section>
    </aside>
  );
}

export function AssessmentFooter({
  total,
  pasteCount,
  submitting,
  disabled,
  reviewing,
  onBack,
}: {
  total: number;
  pasteCount: number;
  submitting: boolean;
  disabled: boolean;
  reviewing: boolean;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-5 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <FileText size={14} />
          {total} questions
        </span>
        <span className="h-3 border-l border-border" />
        <span className={pasteCount > 0 ? "text-warning" : ""}>
          {pasteCount} paste {pasteCount === 1 ? "attempt" : "attempts"}
        </span>
      </div>
      {reviewing ? (
        <Button type="button" size="lg" onClick={onBack}>
          Back to Results
          <ArrowRight />
        </Button>
      ) : (
        <Button type="submit" size="lg" disabled={disabled || submitting} className="h-11">
          {submitting ? (
            <>
              <LoaderCircle className="animate-spin" />
              Submitting assessment…
            </>
          ) : (
            <>
              Submit Assessment
              <ArrowRight />
            </>
          )}
        </Button>
      )}
    </div>
  );
}
