"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Training, TrainingModule, ParticipantResponse } from "@oruclass/types";

export type ParticipatingTraining = Training & {
  participantJoinedAt: string;
  participantConnectionStatus: string;
  creator?: { name: string; email: string };
};

export function useParticipatingSessions() {
  return useQuery({
    queryKey: ["participant_sessions"],
    queryFn: async () => {
      const { data } = await apiClient.get<ParticipatingTraining[]>("/api/participant/sessions");
      return data;
    },
  });
}

export interface ReviewTraining extends Omit<Training, "facilitators" | "modules" | "days"> {
  modules: TrainingModule[];
  labels?: string[];
  type?: string;

  creator?: { id: string; name: string; email: string };
  facilitators?: Array<{ role: string; user: { id: string; name: string; email: string } }>;
  days?: Array<{ id: string; dayNumber: number; title: string; date: string | null; description: string | null }>;
}

export interface TrainingReviewData {
  training: ReviewTraining;
  responses: ParticipantResponse[];
  personalNotes: string;
  personalWhiteboard: Record<string, unknown>;
  joinedAt: string;
}

export function useParticipantTrainingReview(trainingId: string) {
  return useQuery({
    queryKey: ["participant_training_review", trainingId],
    queryFn: async () => {
      const { data } = await apiClient.get<TrainingReviewData>(`/api/participant/trainings/${trainingId}/review`);
      return data;
    },
    enabled: !!trainingId,
  });
}
