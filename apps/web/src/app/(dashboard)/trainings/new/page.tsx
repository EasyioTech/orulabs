import type { Metadata } from "next";
import { CreateTrainingForm } from "@/components/training/CreateTrainingForm";

export const metadata: Metadata = { title: "New Training" };

export default function NewTrainingPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Training</h1>
      <CreateTrainingForm />
    </div>
  );
}
