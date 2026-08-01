import { env } from '../config/env.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MAX_INPUT_LENGTH = 12_000;

export class AiServiceError extends Error {
  constructor(message: string, public readonly status = 503) { super(message); }
}

type Message = { role: 'system' | 'user'; content: string };

function clean(value: unknown) { return String(value ?? '').trim().slice(0, MAX_INPUT_LENGTH); }
function parseJson(value: string) {
  const normalized = value.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  return JSON.parse(normalized);
}

export function isAiConfigured() {
  const apiKey = env.GROQ_API_KEY.trim();
  return apiKey.length > 0 && !apiKey.startsWith('replace-with-');
}

export async function generateJson<T>(system: string, input: string): Promise<T> {
  if (!isAiConfigured()) throw new AiServiceError('AI assistant is not configured. Set GROQ_API_KEY in backend/.env.', 503);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: env.GROQ_MODEL,
        temperature: 0.3,
        max_completion_tokens: 1_500,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: `${system}\nReturn only valid JSON. Do not include markdown or claims not grounded in the input.` },
          { role: 'user', content: clean(input) },
        ] satisfies Message[],
      }),
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      throw new AiServiceError(detail?.error?.message || 'AI provider request failed.', response.status === 401 ? 503 : response.status);
    }
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new AiServiceError('AI provider returned an empty response.', 502);
    try { return parseJson(content) as T; }
    catch { throw new AiServiceError('AI provider returned an invalid structured response.', 502); }
  } catch (error) {
    if (error instanceof AiServiceError) throw error;
    throw new AiServiceError(error instanceof Error && error.name === 'AbortError' ? 'AI request timed out.' : 'AI provider is temporarily unavailable.', 503);
  } finally { clearTimeout(timeout); }
}

type InterviewQuestion = { question: string; category: string; rubric: string[] };
export async function createInterviewQuestion(input: { role?: string; skills?: string[]; previousAnswers?: string[] }) {
  return generateJson<InterviewQuestion>('You are a fair technical interview coach. Generate one practical question calibrated to the role and skills. Never infer protected traits. JSON shape: {question:string,category:string,rubric:string[]}.', JSON.stringify(input));
}

export async function evaluateInterviewAnswer(input: { role?: string; question: string; answer: string }) {
  return generateJson<{ scores: { technical: number; communication: number; problemSolving: number; overall: number }; feedback: string; strengths: string[]; improvements: string[]; nextQuestion: InterviewQuestion }>('You are a supportive interview evaluator. Score only the submitted answer, from 0 to 100, and give concrete feedback. JSON shape: {scores:{technical:number,communication:number,problemSolving:number,overall:number},feedback:string,strengths:string[],improvements:string[],nextQuestion:{question:string,category:string,rubric:string[]}}.', JSON.stringify(input));
}

export async function createCareerRoadmap(input: { currentRole?: string; targetRole: string; skills?: string[]; goals?: string }) {
  return generateJson<{ summary: string; strengths: string[]; gaps: string[]; plan: Array<{ title: string; timeframe: string; actions: string[]; evidence: string }> }>('You are a practical career coach. Build an evidence-led, achievable 90-day roadmap. JSON shape: {summary:string,strengths:string[],gaps:string[],plan:[{title:string,timeframe:string,actions:string[],evidence:string}]}.', JSON.stringify(input));
}

export async function createResumeDraft(input: { targetRole: string; profile: string; evidence?: string[] }) {
  return generateJson<{ headline: string; summary: string; keySkills: string[]; experienceBullets: string[]; projects: string[] }>('You are a resume editor. Use only supplied facts, avoid inventing employers or metrics, and write concise ATS-friendly content. JSON shape: {headline:string,summary:string,keySkills:string[],experienceBullets:string[],projects:string[]}.', JSON.stringify(input));
}

export async function analyzeRoleMatch(input: { role: string; requiredSkills?: string[]; candidates: Array<{ id: string; name: string; title: string; skills: string[]; evidence?: string }> }) {
  return generateJson<{ matches: Array<{ id: string; score: number; matchedSkills: string[]; gaps: string[]; rationale: string }> }>('You are an explainable recruiting assistant. Rank candidates only on supplied work evidence and skills. Never infer protected traits. JSON shape: {matches:[{id:string,score:number,matchedSkills:string[],gaps:string[],rationale:string}]}.', JSON.stringify(input));
}

export async function analyzePresentationWithAi(input: { title?: string; content: string; audience?: string }) {
  return generateJson<{ scores: { clarity: number; feasibility: number; innovation: number; quality: number; overall: number }; feedback: string; strengths: string[]; suggestions: string[] }>('You are a presentation reviewer. Score only the provided content from 0 to 100. JSON shape: {scores:{clarity:number,feasibility:number,innovation:number,quality:number,overall:number},feedback:string,strengths:string[],suggestions:string[]}.', JSON.stringify(input));
}

export async function analyzeTrust(input: { claims: string[]; evidence: string[] }) {
  return generateJson<{ riskLevel: 'low' | 'medium' | 'high'; confidence: number; flags: string[]; reviewQuestions: string[] }>('You are a trust-review assistant. Identify only evidence gaps and inconsistencies; do not make fraud accusations. JSON shape: {riskLevel:"low"|"medium"|"high",confidence:number,flags:string[],reviewQuestions:string[]}.', JSON.stringify(input));
}