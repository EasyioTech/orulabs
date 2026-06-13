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
