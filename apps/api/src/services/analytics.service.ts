import { db } from "../db/client";
import {
  trainingModules,
  participantResponses,
  trainingParticipants,
  trainingAnalytics,
  users,
} from "../db/schema";
import { eq, inArray } from "drizzle-orm";
import ExcelJS from "exceljs";
import type { ModuleConfig, QuizQuestion } from "@oruclass/types";
// eslint-disable-next-line @typescript-eslint/no-var-requires
import Sentiment from "sentiment";

/** Shape of the jsonb `responseData` column across module types (all fields optional). */
type ResponseData = {
  emoji?: string;
  selected?: string[];
  words?: string[];
  answers?: Record<string, string>;
  text?: string;
  question?: string;
  questions?: string[];
};

type ModuleInsights = Record<string, unknown> | null;

const sentiment = new Sentiment();

export async function getTrainingAnalytics(trainingId: string) {
  const [modules, participants] = await Promise.all([
    db.select().from(trainingModules).where(eq(trainingModules.trainingId, trainingId)),
    db.select().from(trainingParticipants).where(eq(trainingParticipants.trainingId, trainingId)),
  ]);

  const responseRows = await db
    .select()
    .from(participantResponses)
    .where(eq(participantResponses.trainingId, trainingId));

  const moduleStats = modules.map((mod) => {
    const responses = responseRows.filter((r) => r.moduleId === mod.id);
    const config = mod.config as ModuleConfig;

    let insights: ModuleInsights = null;

    if (mod.moduleType === "pulse") {
      const distribution: Record<string, number> = {};
      responses.forEach((r) => {
        const data = r.responseData as ResponseData;
        if (data?.emoji) {
          distribution[data.emoji] = (distribution[data.emoji] || 0) + 1;
        }
      });
      insights = { distribution };
    } else if (mod.moduleType === "poll") {
      const distribution: Record<string, number> = {};
      responses.forEach((r) => {
        const data = r.responseData as ResponseData;
        if (Array.isArray(data?.selected)) {
          data.selected.forEach((opt) => {
            distribution[opt] = (distribution[opt] || 0) + 1;
          });
        }
      });
      // Map option index/text to display text if config is available.
      const optionsMap: Record<string, string> = {};
      (config.pollOptions ?? []).forEach((opt, idx) => {
        optionsMap[`opt_${idx}`] = opt;
        optionsMap[opt] = opt;
      });
      insights = { distribution, optionsMap };
    } else if (mod.moduleType === "quiz") {
      let totalScore = 0;
      const scores: number[] = [];
      const questions: QuizQuestion[] = config.questions ?? [];
      const qStats: Record<string, { correct: number; incorrect: number; text: string }> = {};

      questions.forEach((q) => {
        qStats[q.id] = { correct: 0, incorrect: 0, text: q.text };
      });

      responses.forEach((r) => {
        const data = r.responseData as ResponseData;
        const answers = data?.answers ?? {};
        let score = 0;

        questions.forEach((q) => {
          if (q.type === "multiple_choice" || q.type === "true_false") {
            if (answers[q.id] === q.correctAnswer) {
              score++;
              if (qStats[q.id]) qStats[q.id].correct++;
            } else {
              if (qStats[q.id]) qStats[q.id].incorrect++;
            }
          }
        });
        scores.push(score);
        totalScore += score;
      });
      
      insights = {
        averageScore: scores.length > 0 ? Math.round((totalScore / scores.length) * 10) / 10 : 0,
        maxPossible: questions.length,
        questionStats: qStats
      };
    } else if (mod.moduleType === "wordcloud") {
      const wordCounts: Record<string, number> = {};
      responses.forEach((r) => {
        const data = r.responseData as ResponseData;
        if (Array.isArray(data?.words)) {
          data.words.forEach((w) => {
            const word = w.trim().toLowerCase();
            if (word) {
              wordCounts[word] = (wordCounts[word] || 0) + 1;
            }
          });
        }
      });
      
      const topWords = Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([text, value]) => ({ text, value }));
        
      insights = { topWords };
    } else if (mod.moduleType === "reflection" || mod.moduleType === "qna") {
      let totalScore = 0;
      let count = 0;
      let positive = 0;
      let neutral = 0;
      let negative = 0;
      
      responses.forEach((r) => {
        const data = r.responseData as ResponseData;
        let textToAnalyze = "";

        if (mod.moduleType === "reflection" && typeof data?.text === "string") {
          textToAnalyze = data.text;
        } else if (mod.moduleType === "qna") {
          if (typeof data?.question === "string") textToAnalyze = data.question;
          else if (Array.isArray(data?.questions)) textToAnalyze = data.questions.join(" ");
        }

        if (textToAnalyze.trim().length > 0) {
          const result = sentiment.analyze(textToAnalyze);
          totalScore += result.comparative;
          count++;
          if (result.comparative > 0.1) positive++;
          else if (result.comparative < -0.1) negative++;
          else neutral++;
        }
      });
      
      if (count > 0) {
        insights = {
          sentimentScore: Math.round((totalScore / count) * 100) / 100,
          distribution: { Positive: positive, Neutral: neutral, Negative: negative }
        };
      }
    }

    return {
      moduleId: mod.id,
      dayId: mod.dayId,
      title: mod.title,
      moduleType: mod.moduleType,
      responseCount: responses.length,
      participantCount: participants.length,
      completionRate:
        participants.length > 0
          ? Math.round((responses.length / participants.length) * 100)
          : 0,
      insights,
    };
  });

  return {
    trainingId,
    totalParticipants: participants.length,
    modules: moduleStats,
    generatedAt: new Date().toISOString(),
  };
}

export async function generateExcel(data: Awaited<ReturnType<typeof getTrainingAnalytics>>): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "OruClass";
  
  // Sheet 1: Overview
  const overviewSheet = workbook.addWorksheet("Overview");
  overviewSheet.columns = [
    { header: "Module", key: "title", width: 30 },
    { header: "Type", key: "type", width: 15 },
    { header: "Responses", key: "responses", width: 15 },
    { header: "Participants", key: "participants", width: 15 },
    { header: "Completion %", key: "completion", width: 15 }
  ];
  overviewSheet.getRow(1).font = { bold: true };
  
  data.modules.forEach(m => {
    overviewSheet.addRow({
      title: m.title,
      type: m.moduleType,
      responses: m.responseCount,
      participants: m.participantCount,
      completion: m.completionRate
    });
  });

  const [participants, responses] = await Promise.all([
    db.select().from(trainingParticipants).where(eq(trainingParticipants.trainingId, data.trainingId)),
    db.select().from(participantResponses).where(eq(participantResponses.trainingId, data.trainingId))
  ]);

  // Resolve user emails for participants
  const participantUserIds = participants.map(p => p.userId);
  const responseUserIds = responses.map(r => r.userId);
  const allUserIds = [...new Set([...participantUserIds, ...responseUserIds])];
  const userRows = allUserIds.length > 0
    ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, allUserIds))
    : [];
  const userMap = new Map(userRows.map(u => [u.id, u]));

  // Sheet 2: Participants
  const participantSheet = workbook.addWorksheet("Participants");
  participantSheet.columns = [
    { header: "Name", key: "name", width: 25 },
    { header: "Email", key: "email", width: 30 },
    { header: "Joined At", key: "joined", width: 20 },
    { header: "Status", key: "status", width: 15 },
  ];
  participantSheet.getRow(1).font = { bold: true };

  participants.forEach(p => {
    const user = userMap.get(p.userId);
    participantSheet.addRow({
      name: user?.name || "Unknown",
      email: user?.email || "Unknown",
      joined: p.joinedAt?.toISOString() || "",
      status: p.connectionStatus || "offline",
    });
  });

  // Sheet 3: Responses
  const responseSheet = workbook.addWorksheet("Detailed Responses");
  responseSheet.columns = [
    { header: "Participant Name", key: "name", width: 25 },
    { header: "Participant Email", key: "email", width: 30 },
    { header: "Module", key: "module", width: 30 },
    { header: "Module Type", key: "type", width: 15 },
    { header: "Response Data", key: "data", width: 50 },
    { header: "Submitted At", key: "submittedAt", width: 20 },
  ];
  responseSheet.getRow(1).font = { bold: true };

  const moduleMap = new Map(data.modules.map(m => [m.moduleId, m]));

  responses.forEach(r => {
    const mod = moduleMap.get(r.moduleId);
    const user = userMap.get(r.userId);

    responseSheet.addRow({
      name: user?.name || "Unknown",
      email: user?.email || "Unknown",
      module: mod?.title || "Unknown",
      type: mod?.moduleType || "Unknown",
      data: typeof r.responseData === "object" ? JSON.stringify(r.responseData) : r.responseData,
      submittedAt: r.submittedAt?.toISOString() || ""
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function saveAnalyticsSnapshot(
  trainingId: string,
  workspaceId: string,
  data: object,
  exportUrl: string | null = null
) {
  const existing = await db
    .select()
    .from(trainingAnalytics)
    .where(eq(trainingAnalytics.trainingId, trainingId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(trainingAnalytics)
      .set({ aggregateData: data as Record<string, unknown>, exportUrl: exportUrl ?? undefined, updatedAt: new Date() })
      .where(eq(trainingAnalytics.trainingId, trainingId));
  } else {
    await db.insert(trainingAnalytics).values({
      trainingId,
      workspaceId,
      aggregateData: data as Record<string, unknown>,
      exportUrl: exportUrl ?? undefined,
    });
  }
}
