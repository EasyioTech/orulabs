"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateTrainingSchema } from "@oruclass/validators";
import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/store/workspace";
import { useCreateTraining } from "@/hooks/useTrainings";
import type { z } from "zod";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { cn } from "@oruclass/utils";

type FormData = {
  title: string;
  labels?: string;
  type: "in_person" | "online" | "hybrid";
  description?: string;
  venue?: string;
  meetingLink?: string;
  startDate?: string;
  endDate?: string;
};

interface Props {
  onSuccess?: (id: string) => void;
}



const TYPES: { value: string; label: string }[] = [
  { value: "in_person", label: "In-Person" },
  { value: "online", label: "Online" },
  { value: "hybrid", label: "Hybrid" },
];

const MaterialInput = ({ label, register, error, type = "text", ...props }: any) => (
  <div className="relative group">
    <input
      type={type}
      {...register}
      {...props}
      placeholder=" "
      className={cn(
        "block w-full rounded-t-md border-0 border-b bg-[#f1f3f4] px-4 pb-2 pt-6 text-[15px] text-gray-900 focus:border-b-2 focus:ring-0 peer hover:bg-[#e8eaed] transition-all outline-none",
        error ? "border-red-500 focus:border-red-500" : "border-gray-400 focus:border-[#1a73e8]"
      )}
    />
    <label className={cn(
      "absolute left-4 top-4 z-10 origin-[0] -translate-y-2.5 scale-75 transform text-[15px] duration-150 peer-focus:-translate-y-2.5 peer-focus:scale-75 pointer-events-none",
      type === "date" || type === "time" ? "-translate-y-2.5 scale-75" : "peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100",
      error ? "text-red-500" : "text-gray-500 peer-focus:text-[#1a73e8]"
    )}>
      {label}
    </label>
    {error && <p className="text-[11px] text-red-500 mt-1 pl-1">{error}</p>}
  </div>
);

const MaterialSelect = ({ label, register, error, options, ...props }: any) => (
  <div className="relative group">
    <select
      {...register}
      {...props}
      className={cn(
        "block w-full rounded-t-md border-0 border-b bg-[#f1f3f4] px-4 pb-2 pt-6 text-[15px] text-gray-900 focus:border-b-2 focus:ring-0 peer hover:bg-[#e8eaed] transition-all appearance-none cursor-pointer outline-none",
        error ? "border-red-500 focus:border-red-500" : "border-gray-400 focus:border-[#1a73e8]"
      )}
    >
      {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <label className={cn(
      "absolute left-4 top-4 z-10 origin-[0] -translate-y-2.5 scale-75 transform text-[15px] duration-150 peer-focus:text-[#1a73e8] pointer-events-none",
      error ? "text-red-500" : "text-gray-500"
    )}>
      {label}
    </label>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 pt-3">
      <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
    </div>
    {error && <p className="text-[11px] text-red-500 mt-1 pl-1">{error}</p>}
  </div>
);

export function CreateTrainingForm({ onSuccess }: Props = {}) {
  const router = useRouter();
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const createTraining = useCreateTraining(workspaceId);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<FormData>({ 
    resolver: zodResolver(CreateTrainingSchema) as any,
    defaultValues: {
      type: "in_person",
    }
  });

  const selectedType = watch("type");
  const startDateStr = watch("startDate");
  const endDateStr = watch("endDate");

  const calculateDuration = () => {
    if (!startDateStr || !endDateStr) return null;
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive of start day
    if (diffDays <= 0) return null;
    return { days: diffDays, hours: diffDays * 8 }; // Assume 8 hours per day
  };

  const duration = calculateDuration();

  const onSubmit = async (data: FormData) => {
    console.log("Submitting CreateTraining form data:", data);
    
    // Add date formatting to convert datetime-local (e.g. 2026-06-01T12:00) 
    // to ISO string (e.g. 2026-06-01T12:00:00Z) expected by datetime validator
    const payload = {
      ...data,
      labels: Array.isArray(data.labels) ? data.labels : data.labels ? String(data.labels).split(",").map(s => s.trim()).filter(Boolean) : undefined,
    };
    
    const { data: training } = await createTraining.mutateAsync(payload);
    router.push(`/trainings/${training.id}/studio`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-6">
        <MaterialInput
          label="Title"
          register={register("title")}
          error={errors.title?.message}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MaterialInput
            label="Labels (comma separated)"
            register={register("labels")}
            error={errors.labels?.message as string}
          />

          <MaterialSelect
            label="Type"
            options={TYPES}
            register={register("type")}
            error={errors.type?.message}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2 px-1">
            <label className="block text-[13px] font-semibold tracking-wide text-gray-500 uppercase">Description</label>
          </div>
          <Controller
            name="description"
            control={control}
            render={({ field }) => {
              const charCount = field.value ? field.value.replace(new RegExp("<[^>]*>?", "gm"), '').length : 0;
              const limit = 2000;
              const isOverLimit = charCount > limit;
              
              return (
                <div>
                  <div className="border border-gray-300 rounded-md overflow-hidden focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8] transition-all">
                    <RichTextEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Optional description…"
                      minHeight="140px"
                    />
                  </div>
                  <div className={`text-[11px] mt-1.5 text-right font-medium ${isOverLimit ? 'text-red-500' : 'text-gray-400'}`}>
                    {charCount} / {limit} characters
                  </div>
                </div>
              );
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MaterialInput
            label="Start Date"
            type="date"
            register={register("startDate")}
            error={errors.startDate?.message}
          />
          <div>
            <MaterialInput
              label="End Date"
              type="date"
              min={startDateStr || undefined}
              register={register("endDate")}
              error={errors.endDate?.message as string}
            />
            <p className="text-[11px] text-gray-400 mt-1.5 pl-1">Each day in this range becomes a planned day automatically.</p>
          </div>
        </div>

        {duration && (
          <div aria-live="polite" className="bg-[#e8f0fe] rounded-md p-4 flex justify-between items-center text-[14px] text-[#1967d2]">
            <span><strong>Duration:</strong> {duration.days} Day{duration.days !== 1 ? 's' : ''}</span>
            <span className="opacity-70 font-medium">{duration.hours} Total Hours</span>
          </div>
        )}

        {selectedType === "in_person" || selectedType === "hybrid" ? (
          <MaterialInput
            label="Venue Location"
            register={register("venue")}
            error={errors.venue?.message}
          />
        ) : null}

        {selectedType === "online" || selectedType === "hybrid" ? (
          <MaterialInput
            label="Virtual Meeting Link"
            type="url"
            register={register("meetingLink")}
            error={errors.meetingLink?.message}
          />
        ) : null}

        {createTraining.isError && (
          <p className="text-sm text-red-500 font-medium">Failed to create training. Try again.</p>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={createTraining.isPending}
          className="px-6 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-md font-medium text-[14px] disabled:opacity-60 transition-colors shadow-sm focus:ring-4 focus:ring-blue-100 outline-none"
        >
          {createTraining.isPending ? "Creating…" : "Create Training"}
        </button>
      </div>
    </form>
  );
}

