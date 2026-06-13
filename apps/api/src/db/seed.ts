/**
 * Dev seed — run once after DB migrations to pre-create mock users + a default workspace.
 * Usage: bun run apps/api/src/db/seed.ts
 */
import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { randomBytes } from "crypto";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema });

const MOCK_USERS = [
  {
    email: "dev.trainer@oruclass.test",
    name: "Dev Trainer",
    avatarUrl: "https://ui-avatars.com/api/?name=Dev+Trainer&background=6366f1&color=fff&size=128",
  },
  {
    email: "dev.participant@oruclass.test",
    name: "Dev Participant",
    avatarUrl: "https://ui-avatars.com/api/?name=Dev+Participant&background=10b981&color=fff&size=128",
  },
];

async function upsertUser(data: { email: string; name: string; avatarUrl: string }) {
  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, data.email));
  if (existing) return existing;
  const [user] = await db.insert(schema.users).values(data).returning();
  return user;
}

async function seed() {
  console.log("Seeding dev users…");
  const [trainer, participant] = await Promise.all(MOCK_USERS.map(upsertUser));

  // Default workspace for trainer
  const existingMembership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(schema.workspaceMembers.userId, trainer.id),
    ),
    with: { workspace: true },
  });

  let workspaceId: string;

  if (existingMembership) {
    workspaceId = existingMembership.workspaceId;
    console.log(`  Workspace exists: ${existingMembership.workspaceId}`);
  } else {
    const [workspace] = await db
      .insert(schema.workspaces)
      .values({ name: "Dev Workspace", ownerId: trainer.id, settings: {} })
      .returning();
    workspaceId = workspace.id;

    await db.insert(schema.workspaceMembers).values({ workspaceId, userId: trainer.id, role: "owner" });
    console.log(`  Created workspace: ${workspaceId}`);
  }

  // Add participant to workspace if not already a member
  const participantMembership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(schema.workspaceMembers.workspaceId, workspaceId),
      eq(schema.workspaceMembers.userId, participant.id),
    ),
  });

  if (!participantMembership) {
    await db.insert(schema.workspaceMembers).values({ workspaceId, userId: participant.id, role: "member" });
    console.log("  Added participant to workspace");
  }

  // Sample training
  const existingTrainings = await db.query.trainings.findMany({
    where: eq(schema.trainings.workspaceId, workspaceId),
  });

  if (existingTrainings.length === 0) {
    const joinToken = randomBytes(12).toString("base64url");
    const [training] = await db
      .insert(schema.trainings)
      .values({
        workspaceId,
        title: "Sample ATL Training",
        labels: ["atl", "sample"],
        description: "A pre-seeded sample training for development.",
        joinToken,
        createdBy: trainer.id,
      })
      .returning();

    await db.insert(schema.trainingFacilitators).values({
      trainingId: training.id,
      userId: trainer.id,
      role: "lead_trainer",
    });

    console.log(`  Created sample training: ${training.id}`);
  }

  console.log("Seed complete.");
  console.log(`  Trainer:     ${trainer.email}  (id: ${trainer.id})`);
  console.log(`  Participant: ${participant.email}  (id: ${participant.id})`);
  console.log(`  Workspace:   ${workspaceId}`);

  await client.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
