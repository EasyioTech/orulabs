"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@oruclass/utils";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { SafeHTML } from "@/components/ui/SafeHTML";
import { useTraining, useUpdateTraining } from "@/hooks/useTrainings";
import { useStudioCan } from "./studioRole";

export function TrainingInfoPanel({ trainingId, workspaceId }: { trainingId: string; workspaceId: string }) {
  const { data: training } = useTraining(workspaceId, trainingId);
  const updateTraining = useUpdateTraining(workspaceId, trainingId);
  const canEdit = useStudioCan("edit_agenda");
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [labels, setLabels] = useState("");
  const [type, setType] = useState("in_person");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [meetingLink, setMeetingLink] = useState("");

  const startEditing = () => {
    if (!training) return;
    setTitle(training.title);
    setLabels(training.labels?.join(", ") ?? "");
    setType(training.type || "in_person");
    setDescription(training.description ?? "");
    setVenue(training.venue ?? "");
    setMeetingLink(training.meetingLink ?? "");
    setEditing(true);
  };

  const save = () => {
    updateTraining.mutate(
      {
        title: title.trim(),
        labels: labels ? labels.split(",").map(s => s.trim()).filter(Boolean) : undefined,
        type,
        description: description.trim() || undefined,
        venue: venue.trim() || undefined,
        meetingLink: meetingLink.trim() || undefined,
      },
      { onSuccess: () => setEditing(false) },
    );
  };

  if (!training) return null;

  return (
    <div className="bg-white rounded-lg border border-[#dadce0] overflow-hidden">
      <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pencil size={14} className="text-gray-500" />
          <h2 className="text-sm font-bold text-gray-900">Training Info</h2>
        </div>
        {!editing && canEdit && (
          <button
            onClick={startEditing}
            className="flex items-center gap-1 text-[11px] text-[#1a73e8] hover:text-brand-800 font-semibold"
          >
            <Pencil size={11} />
            Edit
          </button>
        )}
      </div>

      <div className="p-4">
        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-[#f1f3f4] border-b-2 border-transparent border-b-gray-400 focus:border-b-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-sm outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Labels (comma separated)</label>
              <input
                value={labels}
                onChange={(e) => setLabels(e.target.value)}
                className="w-full px-4 py-2 bg-[#f1f3f4] border-b-2 border-transparent border-b-gray-400 focus:border-b-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-sm outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2 bg-[#f1f3f4] border-b-2 border-transparent border-b-gray-400 focus:border-b-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-sm outline-none transition-colors"
              >
                <option value="in_person">In-Person</option>
                <option value="online">Online</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Description</label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Optional…"
                minHeight="120px"
              />
              <div className="flex justify-end mt-1">
                <span className={cn("text-[10px] font-medium", description.replace(new RegExp("<[^>]*>?", "gm"), '').length > 2000 ? "text-red-500" : "text-gray-500")}>
                  {description.replace(new RegExp("<[^>]*>?", "gm"), '').length} / 2000
                </span>
              </div>
            </div>
            {type === "in_person" || type === "hybrid" ? (
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Venue</label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full px-4 py-2 bg-[#f1f3f4] border-b border-[#80868b] focus:border-b-2 focus:border-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-sm outline-none transition-colors"
                />
              </div>
            ) : null}
            {type === "online" || type === "hybrid" ? (
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Meeting Link</label>
                <input
                  type="url"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  className="w-full px-4 py-2 bg-[#f1f3f4] border-b border-[#80868b] focus:border-b-2 focus:border-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-sm outline-none transition-colors"
                />
              </div>
            ) : null}
            {updateTraining.isError && (
              <p className="text-xs text-red-500">Failed to update.</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-1.5 text-[#1a73e8] bg-transparent rounded-full text-xs font-medium hover:bg-blue-50/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={updateTraining.isPending || !title.trim()}
                className="flex-1 py-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full text-xs font-medium disabled:opacity-60 transition-colors shadow-sm"
              >
                {updateTraining.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-900">{training.title}</p>
            <div className="flex flex-wrap gap-1.5">
              {training.labels?.map((label: string, idx: number) => (
                <span key={idx} className="text-[10px] font-bold bg-[#e8f0fe] text-[#1557b0] px-2 py-0.5 rounded-full border border-brand-100">
                  {label}
                </span>
              ))}
              {training.venue && (
                <span className="text-[10px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100 flex items-center gap-1">
                  {training.venue}
                </span>
              )}
            </div>
            {training.description && (
              <SafeHTML html={training.description} className="text-xs text-gray-500 leading-relaxed prose-gray" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
