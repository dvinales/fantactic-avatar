import "server-only";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { SCRIPT_MODEL } from "@/lib/env";

const SYSTEM = [
  "You are a scriptwriter for short AI talking-avatar videos.",
  "Output ONLY the words the avatar will speak — no stage directions, no scene",
  "headings, no markdown, no quotation marks, no speaker labels.",
  "Write natural, spoken-sounding sentences. Avoid emojis and unpronounceable symbols.",
].join(" ");

function targetWords(durationSeconds?: number): string {
  if (!durationSeconds) return "Keep it concise (roughly 60-120 words).";
  const words = Math.round((durationSeconds / 60) * 150); // ~150 wpm
  return `Target about ${words} words so it runs ~${durationSeconds}s when spoken.`;
}

/** Draft a script from a brief. */
export async function generateScript(input: {
  brief: string;
  tone?: string;
  durationSeconds?: number;
  characterDescription?: string;
}): Promise<string> {
  const lines = [
    `Topic / brief: ${input.brief}`,
    input.tone ? `Tone: ${input.tone}` : "",
    input.characterDescription ? `The speaker is: ${input.characterDescription}` : "",
    targetWords(input.durationSeconds),
  ].filter(Boolean);

  const { text } = await generateText({
    model: anthropic(SCRIPT_MODEL),
    system: SYSTEM,
    prompt: lines.join("\n"),
    maxOutputTokens: 1500,
    temperature: 0.8,
  });
  return text.trim();
}

/** Revise an existing script per a free-form instruction. */
export async function reviseScript(input: {
  script: string;
  instruction: string;
}): Promise<string> {
  const { text } = await generateText({
    model: anthropic(SCRIPT_MODEL),
    system: SYSTEM,
    prompt: `Revise the script below.\n\nInstruction: ${input.instruction}\n\nScript:\n${input.script}`,
    maxOutputTokens: 1500,
    temperature: 0.7,
  });
  return text.trim();
}
