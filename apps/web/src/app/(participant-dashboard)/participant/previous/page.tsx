import type { Metadata } from "next";
import { ParticipantPreviousSessions } from "@/components/dashboard/ParticipantPreviousSessions";

export const metadata: Metadata = { title: "Previous Sessions" };

export default function ParticipantPreviousPage() {
  return <ParticipantPreviousSessions />;
}
