"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});
type FormData = z.infer<typeof schema>;

export function CreateWorkspaceForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: FormData) => apiClient.post("/api/workspaces", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspaces"] });
      router.push("/dashboard");
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Workspace name</label>
        <input
          {...register("name")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="e.g. My School District"
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-500">Failed to create workspace. Try again.</p>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full py-2.5 bg-brand-600 text-white rounded-lg font-medium text-sm hover:bg-brand-700 disabled:opacity-60 transition-colors"
      >
        {mutation.isPending ? "Creating…" : "Create Workspace"}
      </button>
    </form>
  );
}
