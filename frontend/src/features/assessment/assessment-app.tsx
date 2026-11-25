"use client";

import { CircleAlert, LoaderCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AssessmentFooter,
  AssessmentHeader,
  AssessmentOverview,
  PasteWarningBadge,
  TabSwitchWarningBadge,
  ProgressIndicator,
  QuestionCard,
} from "./components";
import { ResultsScreen } from "./results";
import { useAssessment } from "./use-assessment";
import { isMockMode } from "./api";

export function AssessmentApp() {
  const assessment = useAssessment();
  const showResults = assessment.result !== null && !assessment.reviewing;
  return (
    <div className="min-h-screen">
      <AssessmentHeader />
      <main className="portal-container">
        <ProgressIndicator step={showResults ? 2 : 1} />
        {isMockMode() && (
          <div role="status" className="demo-notice">
            <span className="font-semibold">Demo assessment</span>
            <span>
              Sample questions and a fixed sample report — not a real evaluation. Paste attempts
              reflect this session.
            </span>
          </div>
        )}
        {showResults && assessment.result ? (
          <ResultsScreen
            result={assessment.result}
            onNew={assessment.startNew}
            onReview={assessment.review}
            mode={isMockMode() ? "demo" : "live"}
          />
        ) : (
          <div className="py-8 sm:py-10">
            <div className="workspace-heading mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mb-3 text-[11px] font-semibold text-primary">CANDIDATE WORKSPACE</p>
                <h1 className="max-w-3xl text-[27px] font-bold leading-tight sm:text-[32px]">
                  Artificial Intelligence & LLM Assessment
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {assessment.reviewing
                    ? "Your submitted responses. Answers are read-only."
                    : "Answer all questions carefully. Your responses will be evaluated after submission."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <PasteWarningBadge count={assessment.pasteCount} />
                <TabSwitchWarningBadge count={assessment.tabSwitchCount} />
              </div>
            </div>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_250px] lg:gap-10">
              <form
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  void assessment.submit();
                }}
                className="min-w-0 space-y-5"
              >
                {assessment.loading && (
                  <div aria-busy="true" role="status" className="space-y-5">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <LoaderCircle size={16} className="animate-spin" />
                      Loading your questions…
                    </span>
                    {[1, 2, 3].map((number) => (
                      <div key={number} className="question-card space-y-5 p-7">
                        <div className="loading-line h-3 w-32" />
                        <div className="loading-line h-5 w-4/5" />
                        <div className="loading-line h-24 w-full" />
                      </div>
                    ))}
                  </div>
                )}
                {!assessment.loading && assessment.loadError && (
                  <section className="question-card flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
                    <div className="mb-5 flex size-12 items-center justify-center rounded-lg bg-accent text-primary">
                      <CircleAlert size={26} strokeWidth={1.7} />
                    </div>
                    <h2 className="text-lg font-semibold">Your assessment is not available yet</h2>
                    <p
                      role="alert"
                      className="mt-3 max-w-md text-sm leading-6 text-muted-foreground"
                    >
                      {assessment.loadError}
                    </p>
                    <Button
                      variant="outline"
                      className="mt-6"
                      onClick={assessment.retry}
                      type="button"
                    >
                      <RefreshCw />
                      Try again
                    </Button>
                  </section>
                )}
                {!assessment.loading &&
                  !assessment.loadError &&
                  assessment.questions.map((question, index) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      number={index + 1}
                      value={assessment.answers[String(question.id)] ?? ""}
                      onChange={(value) => assessment.updateAnswer(String(question.id), value)}
                      onPasteAttempt={assessment.recordPaste}
                      invalid={assessment.invalidIds.includes(String(question.id))}
                      disabled={assessment.submitting || assessment.reviewing}
                    />
                  ))}
                {assessment.pasteCount > 0 && !assessment.reviewing && (
                  <p
                    role="status"
                    className="flex items-start gap-2 rounded-md border border-warning/20 bg-warning-soft px-4 py-3 text-xs leading-5 text-warning"
                  >
                    <CircleAlert size={15} className="mt-0.5 shrink-0" />
                    Pasting is disabled. Please type your answers manually.
                  </p>
                )}
                {assessment.tabSwitchCount > 0 && !assessment.reviewing && (
                  <p
                    role="status"
                    className="flex items-start gap-2 rounded-md border border-warning/20 bg-warning-soft px-4 py-3 text-xs leading-5 text-warning"
                  >
                    <CircleAlert size={15} className="mt-0.5 shrink-0" />
                    Window or tab switching is monitored. Please keep this assessment window active.
                  </p>
                )}
                {assessment.submitError && (
                  <p
                    role="alert"
                    className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
                  >
                    <CircleAlert size={17} className="shrink-0" />
                    {assessment.submitError}
                  </p>
                )}
                <AssessmentFooter
                  total={assessment.questions.length}
                  pasteCount={assessment.pasteCount}
                  submitting={assessment.submitting}
                  disabled={assessment.loading || Boolean(assessment.loadError)}
                  reviewing={assessment.reviewing}
                  onBack={assessment.backToResults}
                />
              </form>
              <AssessmentOverview
                total={assessment.questions.length}
                completed={assessment.completed}
                answered={assessment.questions.map((question) =>
                  Boolean(assessment.answers[String(question.id)]?.trim()),
                )}
                pasteCount={assessment.pasteCount}
                tabSwitchCount={assessment.tabSwitchCount}
                loading={assessment.loading}
                reviewing={assessment.reviewing}
              />
            </div>
          </div>
        )}
      </main>
      <footer className="portal-container mt-4 flex flex-col items-center justify-between gap-3 border-t border-border py-6 text-[11px] text-muted-foreground sm:flex-row">
        <span>
          Assessment Portal <span className="mx-2 text-border">/</span> Candidate workspace
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={13} />
          Built for fair assessments
        </span>
      </footer>
    </div>
  );
}
