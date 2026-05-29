import {
  GoogleGenerativeAI,
  SchemaType,
} from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are assisting an NHS medical trainee writing a reflection for the JRCPTB e-portfolio using Borton's framework.

You MUST respond with a single JSON object only (no markdown fences, no commentary) with exactly these keys:
- "what" — Borton "What?" (thinking): thoughts at the time of the experience, how they impacted actions or feelings, and what was learned in the moment.
- "so_what" — Borton "So what?" (feeling): significance of what happened, values and feelings influencing learning, and why it matters professionally.
- "now_what" — Borton "Now what?" (doing): learning from the experience, specific future actions, and how the trainee will develop further.

Rules:
- Write in first person as the trainee (e.g. "I thought…", "This made me realize…", "In the future I will…").
- Professional, reflective clinical tone suitable for GMC/NHS portfolio use. No sensational language.
- Each of the three string values MUST be strictly under 300 words. Prefer concise paragraphs; avoid filler.
- Do not invent clinical details not implied by the user's notes; stay faithful to the scenario while polishing phrasing.
- Never include patient names, dates of birth, hospital numbers, or other identifiable information. If the user included any, generalize or omit those details.
- The user's notes may be rough; infer a coherent scenario only when reasonable, otherwise reflect honestly on limited information.`;

const REFLECTION_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    what: { type: SchemaType.STRING },
    so_what: { type: SchemaType.STRING },
    now_what: { type: SchemaType.STRING },
  },
  required: ["what", "so_what", "now_what"],
};

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Server is not configured with GEMINI_API_KEY. Create a key in Google AI Studio and add it to .env.local.",
      },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const notes =
    typeof body === "object" &&
    body !== null &&
    "notes" in body &&
    typeof (body as { notes: unknown }).notes === "string"
      ? (body as { notes: string }).notes.trim()
      : "";

  if (!notes) {
    return NextResponse.json(
      { error: "Please provide non-empty \"notes\" in the request body." },
      { status: 400 },
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema: REFLECTION_SCHEMA,
      },
    });

    const result = await model.generateContent(
      `Turn the following rough notes into the JSON object with keys what, so_what, now_what.\n\nNOTES:\n${notes}`,
    );

    const raw = result.response.text();
    if (!raw?.trim()) {
      return NextResponse.json(
        { error: "No content returned from the model." },
        { status: 502 },
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      return NextResponse.json(
        { error: "Model returned invalid JSON." },
        { status: 502 },
      );
    }

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("what" in parsed) ||
      !("so_what" in parsed) ||
      !("now_what" in parsed)
    ) {
      return NextResponse.json(
        { error: "Model JSON did not include the required keys." },
        { status: 502 },
      );
    }

    const { what, so_what, now_what } = parsed as Record<string, unknown>;
    if (
      typeof what !== "string" ||
      typeof so_what !== "string" ||
      typeof now_what !== "string"
    ) {
      return NextResponse.json(
        { error: "Model JSON fields were not strings." },
        { status: 502 },
      );
    }

    return NextResponse.json({ what, so_what, now_what });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: `Generation failed: ${message}` },
      { status: 502 },
    );
  }
}
