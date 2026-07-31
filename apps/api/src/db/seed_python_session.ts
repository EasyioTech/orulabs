import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { randomBytes, randomUUID } from "crypto";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema });

async function seedSession() {
  console.log("Starting Python Session Seeding (Rich Data)...");

  const users = await db.select().from(schema.users).where(eq(schema.users.email, "gamingcristy19@gmail.com")).limit(1);
  if (users.length === 0) {
    console.error("User gamingcristy19@gmail.com not found!");
    await client.end();
    return;
  }
  const owner = users[0];
  console.log(`Using owner: ${owner.email} (${owner.id})`);

  let workspaceId: string;
  const existingMembership = await db.query.workspaceMembers.findFirst({
    where: eq(schema.workspaceMembers.userId, owner.id),
    with: { workspace: true },
  });

  if (existingMembership) {
    workspaceId = existingMembership.workspaceId;
  } else {
    const [workspace] = await db
      .insert(schema.workspaces)
      .values({ name: "Python Instructors Workspace", ownerId: owner.id, settings: {} })
      .returning();
    workspaceId = workspace.id;
    await db.insert(schema.workspaceMembers).values({ workspaceId, userId: owner.id, role: "owner" });
  }

  // Delete existing "Python Unleashed: The Matrix of Code" trainings for this user to avoid duplicates
  console.log("Cleaning up old sessions...");
  await db.delete(schema.trainings).where(
    and(
      eq(schema.trainings.createdBy, owner.id),
      eq(schema.trainings.title, "Python Unleashed: The Matrix of Code")
    )
  );

  const joinToken = randomBytes(12).toString("base64url");
  const [training] = await db
    .insert(schema.trainings)
    .values({
      workspaceId,
      title: "Python Unleashed: The Matrix of Code",
      labels: ["python", "beginners", "interactive"],
      type: "online",
      description: "A highly psychological, 16-module interactive session designed to hook complete beginners into the world of Python programming.",
      joinToken,
      createdBy: owner.id,
      sessionStatus: "draft",
    })
    .returning();
    
  await db.insert(schema.trainingFacilitators).values({
    trainingId: training.id,
    userId: owner.id,
    role: "lead_trainer",
  });

  console.log(`Created Training Session: ${training.id}`);

  const modulesToCreate = [
    { 
      moduleType: "attendance", 
      title: "Ready Player One", 
      config: { 
        attendanceFields: [
          { id: randomUUID(), label: "Coding Experience", type: "select", options: ["None", "Beginner", "Intermediate"], required: true }
        ]
      } 
    },
    { 
      moduleType: "pulse", 
      title: "Vibe Check", 
      config: { 
        pulsePrompt: "How are we feeling about learning to code?",
        pulseEmojis: ["🤩", "🤔", "😬", "🚀", "😴"],
        isAnonymous: true
      } 
    },
    { 
      moduleType: "wordcloud", 
      title: "What is Python?", 
      config: { 
        wordcloudPrompt: "What comes to mind when you hear the word 'Python'?",
        maxWords: 3
      } 
    },
    { 
      moduleType: "quiz", 
      title: "Myth vs Fact", 
      config: { 
        questions: [
          { id: randomUUID(), text: "Python is named after the dangerous snake.", type: "true_false", correctAnswer: "False" },
          { id: randomUUID(), text: "Which of these is a Python data type?", type: "multiple_choice", options: ["List", "Queue", "Stack", "Tree"], correctAnswer: "List" }
        ]
      } 
    },
    { 
      moduleType: "embed", 
      title: "The 100 Second Pitch", 
      config: { 
        embeds: [
          { id: randomUUID(), url: "https://www.youtube.com/embed/x7X9w_GIm1s", title: "Python in 100 Seconds", description: "Watch this quick intro to understand why Python is so popular." }
        ]
      } 
    },
    { 
      moduleType: "reflection", 
      title: "Your Superpower", 
      config: { 
        prompt: "If you could code anything, what would you build? Describe your dream app or game.",
        maxLength: 1000
      } 
    },
    { 
      moduleType: "document", 
      title: "The Sacred Texts", 
      config: { 
        initialContent: "<h1>Python Cheat Sheet</h1><p>Welcome to the Matrix!</p><h3>Printing</h3><p><code>print('Hello World')</code></p><h3>Variables</h3><p><code>name = 'Neo'</code></p>"
      } 
    },
    { 
      moduleType: "timer", 
      title: "The 2-Minute Challenge", 
      config: { 
        timerLabel: "The 2-Minute Variable Challenge", 
        durationSeconds: 120 
      } 
    },
    { 
      moduleType: "code", 
      title: "Hello Matrix", 
      config: { 
        codePrompt: "Write a script that asks for a user's name and prints a greeting.",
        codeLanguage: "python", 
        initialCode: "name = input('What is your name? ')\n# write your print statement below\n"
      } 
    },
    { 
      moduleType: "whiteboard", 
      title: "Draw an Algorithm", 
      config: { 
        prompt: "Draw a flowchart showing the steps to make a PB&J sandwich." 
      } 
    },
    { 
      moduleType: "mapping", 
      title: "Connect the Concepts", 
      config: { 
        mappingFocusAreas: [
          { id: randomUUID(), title: "Variables", numFields: 3 },
          { id: randomUUID(), title: "Loops", numFields: 3 },
          { id: randomUUID(), title: "Functions", numFields: 3 }
        ]
      } 
    },
    { 
      moduleType: "matrix", 
      title: "Effort vs Impact", 
      config: { 
        rows: ["Easy to Learn", "Hard to Learn"], 
        columns: ["High Impact", "Low Impact"] 
      } 
    },
    { 
      moduleType: "qna", 
      title: "Ask the Oracle", 
      config: { 
        qnaPrompt: "Drop your burning questions about programming here! No question is too silly." 
      } 
    },
    { 
      moduleType: "poll", 
      title: "Choose Your Path", 
      config: { 
        pollQuestion: "Which path will you take after this session?",
        pollOptions: ["Web Development (Django/Flask)", "Data Science (Pandas)", "Game Dev (PyGame)", "AI/Machine Learning"],
        allowMultiple: false
      } 
    },
    { 
      moduleType: "form", 
      title: "Commitment Contract", 
      config: { 
        formTitle: "Commitment Contract", 
        formDescription: "Sign your name to commit to practicing Python for at least 15 minutes a day.",
        formFields: [
          { id: randomUUID(), type: "short_text", label: "Full Name (Signature)", required: true },
          { id: randomUUID(), type: "checkboxes", label: "I commit to:", options: ["15 mins a day", "Asking questions when stuck", "Building one project a week"], required: true }
        ]
      } 
    },
    { 
      moduleType: "custom", 
      title: "Graduation", 
      config: {} 
    },
  ];

  const [trainingDay] = await db.insert(schema.trainingDays).values({
    trainingId: training.id,
    dayNumber: 1,
    title: "Day 1: Welcome to the Matrix",
    deliveryMode: "online",
  }).returning();
  console.log(`Created Day 1: ${trainingDay.id}`);

  for (let i = 0; i < modulesToCreate.length; i++) {
    const mod = modulesToCreate[i];
    await db.insert(schema.trainingModules).values({
      trainingId: training.id,
      dayId: trainingDay.id,
      title: mod.title,
      // @ts-ignore
      moduleType: mod.moduleType,
      position: i,
      config: mod.config,
    });
    console.log(`  Added module [${i + 1}/16]: ${mod.title} (${mod.moduleType})`);
  }

  console.log("Seed complete! 🎉");
  await client.end();
}

seedSession().catch((err) => {
  console.error(err);
  process.exit(1);
});
