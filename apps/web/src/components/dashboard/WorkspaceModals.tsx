import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, AlertTriangle, Loader2, X } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { Training } from "@oruclass/types";
import { cn } from "@oruclass/utils";
import { useWorkspaceStore } from "@/store/workspace";
import { useUpdateTraining } from "@/hooks/useTrainings";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

export function DeleteTrainingModal({ isOpen, onClose, training, onDelete }: { isOpen: boolean, onClose: () => void, training: Training, onDelete: () => void }) {
  const [input, setInput] = useState("");
  const isMatch = input === training.title;

  useEffect(() => {
    if (!isOpen) setInput("");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-lg animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Training</h3>
        <p className="text-gray-600 mb-6 text-sm">
          Move <strong>{training.title}</strong> to trash? You can restore it later from the trash folder.
        </p>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Please type <strong>{training.title}</strong> to confirm.
          </label>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
            placeholder={training.title}
          />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">
            Cancel
          </button>
          <button
            disabled={!isMatch}
            onClick={() => { if (isMatch) onDelete(); }}
            className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Delete Training
          </button>
        </div>
      </div>
    </div>
  );
}

const TYPES: { value: string; label: string }[] = [
  { value: "in_person", label: "In-Person" },
  { value: "online", label: "Online" },
  { value: "hybrid", label: "Hybrid" },
];

export function EditTrainingModal({ isOpen, onClose, training }: { isOpen: boolean; onClose: () => void; training: Training }) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const updateTraining = useUpdateTraining(workspaceId, training.id);
  const [title, setTitle] = useState(training.title);
  const [labels, setLabels] = useState(training.labels?.join(", ") ?? "");
  const [type, setType] = useState(training.type || "in_person");
  const [description, setDescription] = useState(training.description ?? "");
  const [venue, setVenue] = useState(training.venue ?? "");
  const [meetingLink, setMeetingLink] = useState(training.meetingLink ?? "");
  const [startDate, setStartDate] = useState(
    training.startDate ? new Date(training.startDate).toISOString().split("T")[0] : ""
  );
  const [endDate, setEndDate] = useState(
    training.endDate ? new Date(training.endDate).toISOString().split("T")[0] : ""
  );

  useEffect(() => {
    if (isOpen) {
      setTitle(training.title);
      setLabels(training.labels?.join(", ") ?? "");
      setType(training.type || "in_person");
      setDescription(training.description ?? "");
      setVenue(training.venue ?? "");
      setMeetingLink(training.meetingLink ?? "");
      setStartDate(training.startDate ? new Date(training.startDate).toISOString().split("T")[0] : "");
      setEndDate(training.endDate ? new Date(training.endDate).toISOString().split("T")[0] : "");
    }
  }, [isOpen, training]);

  if (!isOpen) return null;

  const handleSave = () => {
    updateTraining.mutate(
      {
        title: title.trim(),
        labels: labels ? labels.split(",").map(s => s.trim()).filter(Boolean) : undefined,
        type: type as "in_person" | "online" | "hybrid",
        description: description.trim() || undefined,
        venue: venue.trim() || undefined,
        meetingLink: meetingLink.trim() || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-lg animate-in fade-in zoom-in duration-200 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Edit Training</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"><X size={18} /></button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Labels (comma separated)</label>
            <input
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
              placeholder="e.g. tech, leadership"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Optional description…"
            minHeight="120px"
          />
          <div className="flex justify-end mt-1">
            <span className={cn("text-xs font-medium", description.replace(new RegExp("<[^>]*>?", "gm"), '').length > 2000 ? "text-red-500" : "text-gray-500")}>
              {description.replace(new RegExp("<[^>]*>?", "gm"), '').length} / 2000 characters
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-xs text-gray-400 mt-1">Moving the start date shifts existing days to match.</p>
          </div>
        </div>
        {(type === "in_person" || type === "hybrid") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue Location</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Conference Room A"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        )}
        {(type === "online" || type === "hybrid") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Virtual Meeting Link</label>
            <input
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="e.g. https://zoom.us/j/123456789"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        )}
        {updateTraining.isError && (
          <p className="text-sm text-red-500">Failed to update training. Try again.</p>
        )}
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateTraining.isPending || !title.trim()}
            className="flex-1 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {updateTraining.isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

