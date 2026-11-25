"use client";

import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  FileCheck2,
  ListChecks,
  ClipboardX,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { AssessmentResult } from "./types";

export function ResultsHeader() {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-success">
        <CircleCheck size={15} />
        ASSESSMENT COMPLETE
      </div>
      <h1 className="text-[28px] font-bold leading-tight sm:text-[32px]">
        Your assessment results
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Your evaluation and assessment integrity report.
      </p>
    </div>
  );
}

export function ScoreCard({ result }: { result: AssessmentResult }) {
  return (
    <section className="question-card score-panel p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <FileCheck2 size={17} className="text-primary" />
          Overall score
        </h2>
        <span className="rounded bg-accent px-2 py-1 text-xs text-primary">Evaluation</span>
      </div>
      <div className="mb-6 flex items-baseline gap-2">
        <span className="score-number text-primary">{result.overall_score}</span>
        <span className="text-lg text-muted-foreground">/ 100</span>
      </div>
      <Progress value={result.overall_score} aria-label="Overall score" />
      <div className="mt-5 flex justify-between border-t border-border pt-4 text-sm">
        <span className="text-muted-foreground">Authenticity score</span>
        <span className="font-semibold">
          {result.authenticity_score}
          <span className="font-normal text-muted-foreground"> / 100</span>
        </span>
      </div>
    </section>
  );
}

export function IntegrityCard({ status }: { status: string }) {
  const verified = status === "Verified Human";
  const flagged = status === "Flagged";
  return (
    <section className="question-card flex flex-col p-6 sm:p-8">
      <h2 className="mb-6 flex items-center gap-2 text-sm font-semibold">
        <ShieldCheck size={17} className="text-primary" />
        Integrity status
      </h2>
      <div
        className={`mb-4 flex size-12 items-center justify-center rounded-lg ${verified ? "bg-success-soft text-success" : flagged ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground"}`}
      >
        {verified ? (
          <ShieldCheck size={27} strokeWidth={1.7} />
        ) : (
          <TriangleAlert size={27} strokeWidth={1.7} />
        )}
      </div>
      <h3
        className={`text-xl font-semibold ${verified ? "text-success" : flagged ? "text-warning" : "text-foreground"}`}
      >
        {status}
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        {verified
          ? "No configured integrity flags were detected."
          : flagged
            ? "One or more integrity checks (paste, AI phrasing, or window switch) were triggered."
            : "Integrity status returned by the assessment service."}
      </p>
    </section>
  );
}

export function ScoreBreakdown({ deductions }: { deductions: AssessmentResult["deductions"] }) {
  return (
    <section className="question-card p-6 sm:p-7">
      <h2 className="mb-6 flex items-center gap-2 text-base font-semibold">
        <ListChecks size={18} className="text-primary" />
        Score breakdown
      </h2>
      <dl className="space-y-5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Initial authenticity score</dt>
          <dd className="font-medium">{deductions.initial_score}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Phrase detection deduction</dt>
          <dd className={deductions.phrase_deduction ? "font-medium text-warning" : "font-medium"}>
            {deductions.phrase_deduction ? "−" : ""}
            {deductions.phrase_deduction}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Paste attempt deduction</dt>
          <dd className={deductions.paste_deduction ? "font-medium text-warning" : "font-medium"}>
            {deductions.paste_deduction ? "−" : ""}
            {deductions.paste_deduction}
          </dd>
        </div>
        <div className="flex justify-between border-t border-border pt-5 font-semibold">
          <dt>Final score</dt>
          <dd className="text-primary">
            {deductions.final_score}
            <span className="font-normal text-muted-foreground"> / 100</span>
          </dd>
        </div>
      </dl>
    </section>
  );
}

export function DetectedPhrases({ phrases }: { phrases: string[] }) {
  return (
    <section className="question-card p-6 sm:p-7">
      <h2 className="mb-4 text-sm font-semibold">Detected phrases</h2>
      {phrases.length ? (
        <ul className="flex flex-wrap gap-2">
          {phrases.map((phrase, index) => (
            <li
              key={`${phrase}-${index}`}
              className="max-w-full break-words rounded-md bg-warning-soft px-3 py-1.5 text-xs font-medium text-warning"
            >
              {phrase}
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-start gap-2 text-sm leading-6 text-muted-foreground">
          <CircleCheck size={16} className="mt-1 shrink-0 text-success" />
          No configured suspicious phrases detected.
        </p>
      )}
    </section>
  );
}

export function ResultsScreen({
  result,
  onNew,
  onReview,
}: {
  result: AssessmentResult;
  onNew: () => void;
  onReview: () => void;
  mode?: "demo" | "live";
}) {
  return (
    <div className="py-8 sm:py-10">
      <div className="report-heading">
        <ResultsHeader />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <ScoreCard result={result} />
        <IntegrityCard status={result.integrity_status} />
        <ScoreBreakdown deductions={result.deductions} />
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <section className="question-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">Paste attempts</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Recorded during this session
                  </p>
                </div>
                <div
                  className={`flex items-center gap-2 ${result.paste_count ? "text-warning" : "text-success"}`}
                >
                  <ClipboardX size={20} />
                  <span className="text-2xl font-semibold">{result.paste_count}</span>
                </div>
              </div>
            </section>
            <section className="question-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">Window switches</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tab or app switches detected
                  </p>
                </div>
                <div
                  className={`flex items-center gap-2 ${result.tab_switch_count ? "text-warning" : "text-success"}`}
                >
                  <TriangleAlert size={20} />
                  <span className="text-2xl font-semibold">{result.tab_switch_count ?? 0}</span>
                </div>
              </div>
            </section>
          </div>
          <DetectedPhrases phrases={result.detected_phrases} />
        </div>
      </div>
      <div className="mt-8 flex flex-col-reverse justify-between gap-3 border-t border-border pt-6 sm:flex-row">
        <Button variant="outline" size="lg" onClick={onReview}>
          <ArrowLeft />
          Review Assessment
        </Button>
        <Button size="lg" onClick={onNew}>
          <RotateCcw />
          Start New Assessment
          <ArrowRight />
        </Button>
      </div>
    </div>
  );
}
