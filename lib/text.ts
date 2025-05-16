// app/api/course/generate/route.ts
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/firebase/admin";
import { z } from "zod";

// Zod Schemas
const resourceSchema = z.object({
  type: z.enum(["video", "article", "exercise"]),
  title: z.string().min(3),
  url: z.string().url(),
  duration: z.number().min(5).max(360),
});

const weekSchema = z.object({
  weekNumber: z.number().min(1).max(52),
  topics: z.array(z.string().min(3)).min(1),
  resources: z.array(resourceSchema).min(1),
  goals: z.array(z.string().min(10)).min(1),
});

const courseSchema = z.object({
  weeks: z.array(weekSchema).min(2).max(26),
});

const courseGenerationSchema = z.object({
  userId: z.string().min(1),
  targetRole: z.string().min(2),
  experienceLevel: z.enum(["entry", "mid", "senior"]),
  industry: z.string().min(2),
  currentSkills: z.array(z.string().min(2)).min(1),
  learningGoals: z.array(z.string().min(10)).min(1),
  preferredFormat: z.enum(["video", "article", "mixed"]),
  weeklyHours: z.number().min(2).max(40),
});

const MAX_RETRIES = 3;

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const validated = courseGenerationSchema.parse(requestData);

    let courseData;
    let attempts = 0;
    let success = false;

    while (attempts < MAX_RETRIES && !success) {
      try {
        const { text } = await generateText({
          model: google("gemini-2.0-flash-001"),
          maxTokens: 4000,
          temperature: 0.7,
          prompt: `Generate a personalized learning course in PURE JSON format following these rules:
            1. Strictly use double quotes only
            2. No markdown syntax of any kind
            3. No trailing commas
            4. Maintain valid JSON structure
            5. Escape special characters
            
            Parameters:
            ${JSON.stringify(validated, null, 2)}
            
            Required format:
            ${JSON.stringify(courseSchema.shape, null, 2)}`,
        });

        // Clean the AI response
        const cleanedText = text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .replace(/,\s*]/g, "]") // Remove trailing commas
          .replace(/,\s*}/g, "}") // Remove trailing commas
          .trim();

        // Parse and validate
        courseData = courseSchema.parse(JSON.parse(cleanedText));
        success = true;
      } catch (error) {
        attempts++;
        if (attempts === MAX_RETRIES) {
          throw new Error(
            `Failed after ${MAX_RETRIES} attempts: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }
    }

    if (!success || !courseData) {
      throw new Error("Course generation failed after maximum retries");
    }

    // Save to Firestore
    const courseDoc = {
      ...courseData,
      meta: {
        generatedAt: new Date().toISOString(),
        version: 1,
        userId: validated.userId,
        progress: 0,
      },
    };

    // await db.collection("courses").doc(validated.userId).set(courseDoc);

    return Response.json({
      success: true,
      data: courseData,
    });
  } catch (error) {
    console.error("Course generation error:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        ...(process.env.NODE_ENV === "development" && {
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    success: true,
    message: "Course generator endpoint - POST required",
  });
}

/*-----------------------------*/
/*-----------------------------*/
// app/api/course/generate/route.ts
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/firebase/admin";
import { z } from "zod";

// Free API endpoints
const RESOURCE_APIS = {
  YOUTUBE: process.env.NEXT_PUBLIC_YT_API_KEY
    ? `https://www.googleapis.com/youtube/v3/search?part=snippet,contentDetails&type=video&videoDuration=medium&maxResults=5&key=${process.env.NEXT_PUBLIC_YT_API_KEY}&q=`
    : undefined,
  DEV_TO: "https://dev.to/api/articles?top=5&tags=",
  MDN: "https://developer.mozilla.org/api/v1/search?q=",
  FCC: "https://api.freecodecamp.org/api/resources?category=",
};

// Zod Schema: include modulesCount, remove weeklyHours
const userCourseSchema = z.object({
  userId: z.string(),
  targetRole: z.enum([
    "frontend",
    "backend",
    "fullstack",
    "devops",
    "data-scientist",
  ]),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
  techStack: z.array(z.enum(["react", "node", "python", "java", "aws"])),
  programmingLanguages: z.array(z.string()),
  learningGoals: z.array(z.string().min(10)),
  preferredContent: z.array(
    z.enum(["video", "article", "interactive", "documentation"])
  ),
  areasOfFocus: z.array(
    z.enum(["system-design", "algorithms", "soft-skills", "tooling"])
  ),
  modulesCount: z.number().min(1).default(1),
});

type Prefs = z.infer<typeof userCourseSchema>;

// Helpers
function calculateRelevanceScore(text: string) {
  return Math.random();
}
function parseDuration(iso: string) {
  const m = iso.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
  return m ? parseInt(m[1] || "0") * 60 + parseInt(m[2] || "0") : 0;
}
async function fetchYouTube(topic: string) {
  if (!RESOURCE_APIS.YOUTUBE) return [];

  console.log("Fetching YouTube for:", topic);
  try {
    const res = await fetch(
      `${RESOURCE_APIS.YOUTUBE}${encodeURIComponent(topic)}`
    );
    const data = await res.json();
    console.log("YouTube response:", data);

    // If the API returned an error or no items, bail out
    if (!data.items || !Array.isArray(data.items)) {
      console.warn("YouTube: no items array in response");
      return [];
    }

    return data.items.map((it: any) => ({
      type: "video",
      title: it.snippet.title,
      url: `https://youtu.be/${it.id.videoId}`,
      duration: Math.round(parseDuration(it.contentDetails.duration) / 60),
      source: "youtube",
      // no statistics available here, so drop popularity or set default
      popularity: 0,
      score: calculateRelevanceScore(it.snippet.description),
    }));
  } catch (err) {
    console.error("Error fetching YouTube for:", topic, err);
    return [];
  }
}
async function fetchMDN(topic: string) {
  console.log("Fetching MDN for:", topic);
  const res = await fetch(`${RESOURCE_APIS.MDN}${encodeURIComponent(topic)}`);
  const data = await res.json();
  console.log("MDN response:", data);
  return data.documents.map((d: any) => ({
    type: "documentation",
    title: d.title,
    url: `https://developer.mozilla.org${d.slug}`,
    source: "mdn",
    popularity: d.score || 0,
    score: calculateRelevanceScore(d.excerpt || ""),
  }));
}
async function fetchDevTo(topic: string) {
  console.log("Fetching Dev.to for:", topic);
  const res = await fetch(
    `${RESOURCE_APIS.DEV_TO}${encodeURIComponent(topic)}`
  );
  const data = await res.json();
  console.log("Dev.to response:", data);
  return data.map((a: any) => ({
    type: "article",
    title: a.title,
    url: a.url,
    source: "dev.to",
    popularity: a.positive_reactions_count,
    score: calculateRelevanceScore(a.body_markdown),
  }));
}
async function fetchFCC(topic: string) {
  console.log("Fetching freeCodeCamp for:", topic);
  const res = await fetch(`${RESOURCE_APIS.FCC}${encodeURIComponent(topic)}`);
  const data = await res.json();
  console.log("freeCodeCamp response:", data);
  return data.map((f: any) => ({
    type: "interactive",
    title: f.title,
    url: f.url,
    source: "freecodecamp",
    popularity: f.upvotes || 0,
    score: calculateRelevanceScore(f.description || ""),
  }));
}

async function getResources(topic: string, prefs: Prefs) {
  let arr: any[] = [];
  if (prefs.preferredContent.includes("video"))
    arr = arr.concat(await fetchYouTube(topic));
  if (prefs.preferredContent.includes("documentation"))
    arr = arr.concat(await fetchMDN(topic));
  if (prefs.preferredContent.includes("article"))
    arr = arr.concat(await fetchDevTo(topic));
  if (prefs.preferredContent.includes("interactive"))
    arr = arr.concat(await fetchFCC(topic));
  return arr.sort((a, b) => b.score - a.score).slice(0, 3);
}

export async function POST(req: Request) {
  try {
    const input = await req.json();
    const prefs = userCourseSchema.parse(input);
    console.log("User prefs:", prefs);

    // Ask AI for sections/modules/lessons
    const systemMsg = `You are an AI that generates a personalized course.
Role:${prefs.targetRole}
Experience:${prefs.experienceLevel}
Tech Stack:${prefs.techStack.join(",")}
Languages:${prefs.programmingLanguages.join(",")}
Goals:${prefs.learningGoals.join(";")}
Focus:${prefs.areasOfFocus.join(",")}
ModulesCount:${prefs.modulesCount}`;
    const userPrompt =
      'Generate ONLY valid JSON with "sections" array. Each section has title, modules[]. Each module has title, lessons[].';

    const { text } = await generateText({
      model: google("gemini-2.0-flash-001"),
      system: systemMsg,
      prompt: userPrompt,
    });
    console.log("Raw AI response:", text);

    // Clean and parse JSON
    let j = text.replace(/```\w*|```/g, "").trim();
    const s = j.indexOf("{"),
      e = j.lastIndexOf("}");
    if (s >= 0 && e >= 0) j = j.slice(s, e + 1);
    const course = JSON.parse(j) as {
      sections: Array<{
        title: string;
        modules: Array<{ title: string; lessons: string[] }>;
      }>;
    };

    // Enrich with real resources
    const enriched = await Promise.all(
      course.sections.map(async (sec) => ({
        title: sec.title,
        modules: await Promise.all(
          sec.modules.map(async (mod) => ({
            title: mod.title,
            lessons: await Promise.all(
              mod.lessons.map(async (lesson) => ({
                title: lesson,
                resources: await getResources(lesson, prefs),
              }))
            ),
          }))
        ),
      }))
    );

    console.log("Enriched structure:", enriched);
    // await db
    //   .collection("courses")
    //   .doc(prefs.userId)
    //   .set({ ...prefs, curriculum: enriched, generatedAt: new Date() });

    return new Response(JSON.stringify({ success: true, data: enriched }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Error in POST /generate:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
