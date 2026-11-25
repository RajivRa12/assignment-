import { useEffect, useRef, useState } from "react";
import { fetchQuestions, isMockMode, submitAssessment } from "./api";
import { getUnanswered, type Answers, type AssessmentResult, type Question } from "./types";

export function useAssessment() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [pasteCount, setPasteCount] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [invalidIds, setInvalidIds] = useState<string[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const submissionLock = useRef(false);
  const hasStarted = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError("");
    fetchQuestions(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setQuestions(data);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setLoadError(error instanceof Error ? error.message : "Couldn't load your assessment.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    if (result !== null || reviewing || loading) return;
    let lastTrigger = 0;
    function handleSwitch() {
      const now = Date.now();
      if (now - lastTrigger > 1000) {
        lastTrigger = now;
        setTabSwitchCount((count) => count + 1);
      }
    }
    window.addEventListener("blur", handleSwitch);
    function onVisibilityChange() {
      if (document.hidden) handleSwitch();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("blur", handleSwitch);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [result, reviewing, loading]);

  useEffect(() => {
    if (result !== null || reviewing || loading) return;
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (hasStarted.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [result, reviewing, loading]);

  function updateAnswer(id: string, value: string) {
    setAnswers((previous) => ({ ...previous, [id]: value }));
    if (value.trim()) setInvalidIds((previous) => previous.filter((invalidId) => invalidId !== id));
    setSubmitError("");
    if (value.trim() && !hasStarted.current) {
      hasStarted.current = true;
    }
  }

  async function submit() {
    if (submissionLock.current || loading || !questions.length || result) return;
    const missing = getUnanswered(questions, answers);
    setInvalidIds(missing);
    if (missing.length) {
      setSubmitError("Please answer all three questions before submitting.");
      document
        .getElementById(`question-${missing[0]}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      document.getElementById(`answer-${missing[0]}`)?.focus();
      return;
    }
    submissionLock.current = true;
    setSubmitting(true);
    setSubmitError("");
    try {
      setResult(
        await submitAssessment({
          answers: { ...answers },
          paste_count: pasteCount,
          tab_switch_count: tabSwitchCount,
        }),
      );
      setReviewing(false);
      window.scrollTo({ top: 0, behavior: "instant" });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Couldn't submit your assessment. Please try again.",
      );
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  }

  function startNew() {
    setAnswers({});
    setPasteCount(0);
    setTabSwitchCount(0);
    setResult(null);
    setReviewing(false);
    setQuestions([]);
    setInvalidIds([]);
    setSubmitError("");
    setLoading(true);
    setReloadKey((key) => key + 1);
    hasStarted.current = false;
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  return {
    questions,
    answers,
    pasteCount,
    tabSwitchCount,
    result,
    reviewing,
    loading,
    submitting,
    loadError,
    submitError,
    invalidIds,
    completed: questions.length - getUnanswered(questions, answers).length,
    updateAnswer,
    recordPaste: () => setPasteCount((count) => count + 1),
    submit,
    startNew,
    retry: () => setReloadKey((key) => key + 1),
    review: () => {
      setReviewing(true);
      window.scrollTo({ top: 0, behavior: "instant" });
    },
    backToResults: () => {
      setReviewing(false);
      window.scrollTo({ top: 0, behavior: "instant" });
    },
  };
}
