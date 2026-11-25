import { questionsSchema, resultSchema, type Submission } from "./types";
import { getMockQuestions, getMockResult } from "./mock-data";

function readEnvApiUrl(): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    if (process.env.NEXT_PUBLIC_API_BASE_URL) return process.env.NEXT_PUBLIC_API_BASE_URL;
    if (process.env.VITE_API_BASE_URL) return process.env.VITE_API_BASE_URL;
  }
  return undefined;
}

export function isMockMode() {
  return !readEnvApiUrl()?.trim();
}

export function getApiBaseUrl() {
  const baseUrl = readEnvApiUrl()?.trim();
  if (!baseUrl)
    throw new Error(
      "The assessment service is not connected yet. Please try again once the service is available.",
    );
  return baseUrl.replace(/\/+$/, "");
}

async function request(path: string, init: RequestInit = {}) {
  const baseUrl = getApiBaseUrl();
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: init.signal ?? AbortSignal.timeout(30000),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new Error(
      "We couldn't reach the assessment service. Check your connection and try again. Your answers have been kept.",
    );
  }
  if (!response.ok) {
    let detail = "";
    try {
      const body: unknown = await response.json();
      if (
        typeof body === "object" &&
        body !== null &&
        "detail" in body &&
        typeof body.detail === "string"
      )
        detail = body.detail;
    } catch {
      void 0;
    }
    throw new Error(
      detail ||
        (response.status >= 500
          ? "The assessment service is temporarily unavailable. Please try again."
          : `The service couldn't process the request (${response.status}). Please try again.`),
    );
  }
  try {
    return (await response.json()) as unknown;
  } catch {
    throw new Error("The assessment service returned an unreadable response. Please try again.");
  }
}

export async function fetchQuestions(signal?: AbortSignal) {
  if (isMockMode()) {
    signal?.throwIfAborted();
    return getMockQuestions();
  }
  const body = await request("/api/v1/assessment/questions", signal ? { signal } : {});
  const raw =
    typeof body === "object" && body !== null && "questions" in body ? body.questions : body;
  const parsed = questionsSchema.safeParse(raw);
  if (!parsed.success)
    throw new Error(
      "The service returned an unexpected question format. Please contact the assessment administrator.",
    );
  return parsed.data;
}

export async function submitAssessment(submission: Submission) {
  if (isMockMode()) {
    await new Promise<void>((resolve) => setTimeout(resolve, 500));
    return getMockResult(submission);
  }
  const body = await request("/api/v1/assessment/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(submission),
  });
  const parsed = resultSchema.safeParse(body);
  if (!parsed.success)
    throw new Error(
      "The service returned an incomplete evaluation. Your answers have been kept; please try again.",
    );
  return parsed.data;
}
