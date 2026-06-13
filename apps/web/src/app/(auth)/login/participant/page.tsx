import type { Metadata } from "next";
import { AuthPanel } from "@/components/auth/AuthPanel";

export const metadata: Metadata = { title: "Participant Sign In | OruLabs" };

export default function ParticipantLoginPage() {
  return (
    <AuthPanel
      title="Participant sign in"
      subtitle="Join your trainings and start learning"
      returnTo="/participant"
    />
  );
}
