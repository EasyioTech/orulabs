import type { Metadata } from "next";
import { StudioPage } from "@/components/studio/StudioPage";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Training Studio" };

export default async function TrainingStudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <StudioPage trainingId={id} />
    </Suspense>
  );
}
