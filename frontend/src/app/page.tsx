import { AssessmentApp } from "@/features/assessment/assessment-app";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Full Stack Developer Assessment | Assessment Portal",
  description:
    "Complete your three-question technical assessment and receive your evaluation and integrity report.",
  openGraph: {
    title: "Full Stack Developer Assessment | Assessment Portal",
    description:
      "Complete your technical assessment and review your FastAPI evaluation and integrity report.",
    type: "website",
  },
};

export default function HomePage() {
  return <AssessmentApp />;
}
