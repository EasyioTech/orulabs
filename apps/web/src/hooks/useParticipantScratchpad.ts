import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export type ParticipantScratchpadData = {
  personalNotes: string;
  personalWhiteboard: Record<string, unknown>;
};

export function useParticipantScratchpad(trainingId: string) {
  return useQuery({
    queryKey: ["scratchpad", trainingId],
    queryFn: async () => {
      const { data } = await apiClient.get<ParticipantScratchpadData>(
        `/api/${trainingId}/participants/me/scratchpad`,
      );
      return data;
    },
    enabled: !!trainingId,
  });
}

export function useUpdateParticipantScratchpad(trainingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<ParticipantScratchpadData>) => {
      await apiClient.put(`/api/${trainingId}/participants/me/scratchpad`, payload);
      return payload;
    },
    onMutate: async (newScratchpad) => {
      await queryClient.cancelQueries({ queryKey: ["scratchpad", trainingId] });
      const previous = queryClient.getQueryData<ParticipantScratchpadData>(["scratchpad", trainingId]);
      
      queryClient.setQueryData<ParticipantScratchpadData>(["scratchpad", trainingId], (old) => {
        if (!old) return previous;
        return { ...old, ...newScratchpad };
      });

      return { previous };
    },
    onError: (err, newScratchpad, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["scratchpad", trainingId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["scratchpad", trainingId] });
    },
  });
}
