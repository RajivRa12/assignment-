import { AssessmentApp } from "@/features/assessment/assessment-app";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artificial Intelligence & LLM Assessment | Assessment Portal",
  description:
    "Complete your three-question AI technical assessment and receive your evaluation and integrity report.",
  openGraph: {
    title: "Artificial Intelligence & LLM Assessment | Assessment Portal",
    description:
      "Complete your AI technical assessment and review your FastAPI evaluation and integrity report.",
    type: "website",
  },
};

export default function HomePage() {
  return <AssessmentApp />;
}
