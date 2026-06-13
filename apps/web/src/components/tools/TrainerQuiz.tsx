"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useModuleResponses } from "@/hooks/useModuleResponses";
import { useLiveSessionStore } from "@/store/liveSession";
import type { TrainingModule, QuizQuestion } from "@oruclass/types";
import { CheckCircle2, XCircle, Users, MessageSquare } from "lucide-react";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

// Brand-aligned palette for chart slices. Order = first answer hit gets brand color.
const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4", "#a855f7", "#ef4444", "#84cc16"];

export function TrainerQuiz({ module, trainingId }: Props) {
  const questions = (module.config?.questions ?? []) as QuizQuestion[];

  const participants = useLiveSessionStore((s) => s.participants);
  const joinedCount = useMemo(
    () => Array.from(participants.values()).filter((p) => p.role === "participant").length,
    [participants],
  );

  const { data: responses, isLoading } = useModuleResponses(trainingId, module.id);

  const responseList = responses ?? [];
  const respondedCount = responseList.length;
  const completionPct = joinedCount > 0 ? Math.round((respondedCount / joinedCount) * 100) : 0;

  // Build per-question stats: counts per option (or text answers for short_answer).
  const stats = useMemo(() => {
    return questions.map((q) => {
      const optionCounts = new Map<string, number>();
      const textAnswers: { user: string; text: string }[] = [];
      let correctCount = 0;
      let totalAnswered = 0;

      for (const r of responseList) {
        const data = r.responseData;
        if (data?.type !== "quiz") continue;
        const ans = data.answers?.[q.id];
        if (!ans || !ans.trim()) continue;
        totalAnswered++;
        if (q.correctAnswer && ans === q.correctAnswer) correctCount++;

        if (q.type === "short_answer") {
          textAnswers.push({ user: r.user?.name ?? "Anonymous", text: ans });
        } else {
          optionCounts.set(ans, (optionCounts.get(ans) ?? 0) + 1);
        }
      }

      // Seed bars with 0-count rows for every defined option so the chart shows
      // all choices even when no one picked them.
      const seed =
        q.type === "true_false"
          ? ["True", "False"]
          : q.type === "multiple_choice"
            ? q.options ?? []
            : q.type === "metric_rating"
              ? Array.from({ length: (q.maxVal ?? 10) - (q.minVal ?? 1) + 1 }, (_, i) => String((q.minVal ?? 1) + i))
              : [];
      const bars = seed.map((opt) => ({
        name: opt,
        count: optionCounts.get(opt) ?? 0,
        correct: !!q.correctAnswer && opt === q.correctAnswer,
      }));
      // Also surface unexpected answers (shouldn't normally happen).
      for (const [opt, count] of optionCounts) {
        if (!seed.includes(opt)) bars.push({ name: opt, count, correct: false });
      }

      let averageRating = 0;
      if (q.type === "metric_rating" && totalAnswered > 0) {
        const sum = Array.from(optionCounts.entries()).reduce((acc, [val, count]) => acc + Number(val) * count, 0);
        averageRating = sum / totalAnswered;
      }

      return { q, bars, textAnswers, correctCount, totalAnswered, averageRating };
    });
  }, [questions, responseList]);

  const gradableQuestions = questions.filter((q) => !!q.correctAnswer);
  const overallCorrect = stats
    .filter((s) => !!s.q.correctAnswer)
    .reduce((acc, s) => acc + s.correctCount, 0);
  const overallPossible = gradableQuestions.length * respondedCount;
  const accuracyPct = overallPossible > 0 ? Math.round((overallCorrect / overallPossible) * 100) : 0;

  return (
    <div className="flex h-full flex-col">
      <header className="px-6 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{module.title}</h2>
          <span className="text-xs font-medium text-gray-400">Live results</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <StatTile icon={<Users size={16} />} label="Joined" value={joinedCount} accent="brand" />
          <StatTile icon={<MessageSquare size={16} />} label="Responded" value={respondedCount} accent="violet" />
          <StatTile label="Completion" value={`${completionPct}%`} accent="emerald" />
          <StatTile
            label="Accuracy"
            value={gradableQuestions.length > 0 ? `${accuracyPct}%` : "—"}
            accent="amber"
          />
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 space-y-5 bg-gray-50">
        {isLoading ? (
          <div className="text-center text-gray-400 py-20">Loading responses…</div>
        ) : questions.length === 0 ? (
          <div className="text-center text-gray-400 py-20">No questions configured.</div>
        ) : respondedCount === 0 ? (
          <div className="text-center text-gray-400 py-20">
            <p>No responses yet.</p>
            <p className="text-sm mt-1">Participants are working on the quiz.</p>
          </div>
        ) : (
          stats.map(({ q, bars, textAnswers, correctCount, totalAnswered, averageRating }, qi) => (
            <div key={q.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-brand-700 bg-brand-50 border border-brand-200 rounded-md px-1.5 py-0.5">
                      Q{qi + 1}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide font-semibold text-gray-400">
                      {q.type.replace("_", " ")}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900">{q.text || "(untitled question)"}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400">Answered</p>
                  <p className="text-sm font-bold text-gray-800">{totalAnswered}</p>
                </div>
              </div>

              {q.type === "metric_rating" && totalAnswered > 0 && (
                <div className="mb-4 text-center p-4 bg-brand-50 border border-brand-100 rounded-xl">
                  <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide">Average Rating</p>
                  <p className="text-3xl font-bold text-brand-900 mt-1">{averageRating.toFixed(1)}</p>
                </div>
              )}

              {q.correctAnswer && (
                <div className="flex items-center gap-2 text-xs mb-4 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span className="text-emerald-700">
                    Correct answer: <span className="font-semibold">{q.correctAnswer}</span>
                  </span>
                  <span className="ml-auto text-emerald-700 font-bold">
                    {correctCount}/{totalAnswered} correct
                  </span>
                </div>
              )}

              {q.type === "short_answer" ? (
                <div className="space-y-2 max-h-72 overflow-auto">
                  {textAnswers.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">No answers yet.</p>
                  ) : (
                    textAnswers.map((a, i) => (
                      <div key={i} className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-[11px] font-semibold text-brand-700 mb-0.5">{a.user}</p>
                        <p className="text-sm text-gray-800">{a.text}</p>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={bars.filter((b) => b.count > 0)}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label={(d: { name: string; count: number }) => `${d.name} (${d.count})`}
                        >
                          {bars
                            .filter((b) => b.count > 0)
                            .map((b, i) => (
                              <Cell
                                key={b.name}
                                fill={b.correct ? "#10b981" : COLORS[i % COLORS.length]}
                              />
                            ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className={q.type === "metric_rating" ? "h-56 md:col-span-2" : "h-56"}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={bars} layout={q.type === "metric_rating" ? "horizontal" : "vertical"} margin={{ left: 8, right: 16 }}>
                        {q.type === "metric_rating" ? (
                          <>
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                          </>
                        ) : (
                          <>
                            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                          </>
                        )}
                        <Tooltip />
                        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                          {bars.map((b, i) => (
                            <Cell
                              key={b.name}
                              fill={b.correct ? "#10b981" : COLORS[i % COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {q.correctAnswer && q.type !== "short_answer" && totalAnswered > 0 && (
                <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    {correctCount} correct
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle size={12} className="text-rose-400" />
                    {totalAnswered - correctCount} incorrect
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  accent,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  accent: "brand" | "violet" | "emerald" | "amber";
}) {
  const tone = {
    brand: "bg-brand-50 border-brand-100 text-brand-700",
    violet: "bg-violet-50 border-violet-100 text-violet-700",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
  }[accent];
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${tone}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide opacity-80">
        {icon}
        {label}
      </div>
      <p className="text-xl font-bold mt-0.5">{value}</p>
    </div>
  );
}
