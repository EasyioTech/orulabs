"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient } from "@/lib/api-client";

const schema = z.object({
  email: z.string().email(),
  role: z.enum(["owner", "member"]),
});
type FormValues = {
  email: string;
  role: "owner" | "member";
};

interface Props {
  workspaceId: string;
  onClose: () => void;
}

export function InviteTeamModal({ workspaceId, onClose }: Props) {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    await apiClient.post(`/api/workspaces/${workspaceId}/invite`, data);
    setSent(true);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-md">
        <h2 className="text-lg font-semibold mb-4">Invite Team Member</h2>

        {sent ? (
          <div className="text-center py-6">
            <p className="text-green-600 font-medium">Invitation sent!</p>
            <button onClick={onClose} className="mt-4 text-sm text-gray-500 underline">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                {...register("email")}
                type="email"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="colleague@school.edu"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select {...register("role")} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="member">Member</option>
                <option value="owner">Owner</option>
              </select>
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
                {isSubmitting ? "Sending…" : "Send Invite"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
