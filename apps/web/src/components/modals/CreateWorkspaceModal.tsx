"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient } from "@/lib/api-client";
import { useWorkspaceStore } from "@/store/workspace";

const schema = z.object({ name: z.string().min(2).max(64) });
type FormValues = z.infer<typeof schema>;

interface Props {
  onClose: () => void;
}

export function CreateWorkspaceModal({ onClose }: Props) {
  const addWorkspace = useWorkspaceStore((s) => s.addWorkspace);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    const res = await apiClient.post("/api/workspaces", data);
    addWorkspace(res.data);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-md">
        <h2 className="text-lg font-semibold mb-4">New Workspace</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Workspace name</label>
            <input
              {...register("name")}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="East Wing Teachers"
              autoFocus
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {isSubmitting ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
