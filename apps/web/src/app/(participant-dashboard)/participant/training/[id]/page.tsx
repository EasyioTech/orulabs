"use client";

import { useParams } from "next/navigation";
import { TrainingReviewDetail } from "@/components/participant/TrainingReviewDetail";

export default function TrainingReviewPage() {
  const { id } = useParams<{ id: string }>();
  return <TrainingReviewDetail trainingId={id} />;
}
