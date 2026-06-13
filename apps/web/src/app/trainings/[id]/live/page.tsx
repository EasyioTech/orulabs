import type { Metadata } from "next";
import { LiveRoom } from "@/components/live/LiveRoom";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Live Session" };

export default async function LivePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ role?: string }>;
}) {
  const { id } = await params;
  const { role } = await searchParams;
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <LiveRoom trainingId={id} forceParticipant={role === "participant"} />
    </Suspense>
  );
}
