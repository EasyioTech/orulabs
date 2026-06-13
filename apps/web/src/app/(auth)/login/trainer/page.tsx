import type { Metadata } from "next";
import { AuthPanel } from "@/components/auth/AuthPanel";

export const metadata: Metadata = { title: "Trainer Sign In | OruLabs" };

export default function TrainerLoginPage() {
  return (
    <AuthPanel
      title="Trainer sign in"
      subtitle="Host and manage your live trainings"
      returnTo="/dashboard"
    />
  );
}
