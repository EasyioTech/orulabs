import type { Metadata } from "next";
import { ParticipantDashboard } from "@/components/dashboard/ParticipantDashboard";

export const metadata: Metadata = { title: "Participant Area" };

export default function ParticipantPage() {
  return <ParticipantDashboard />;
}
