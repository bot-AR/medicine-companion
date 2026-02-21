import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY ?? '',
);

const SYSTEM_PROMPT = `You are a careful medication companion AI for elderly patients.
Never give definitive medical advice. Always recommend consulting a doctor.
Respond ONLY with valid JSON matching exactly:
{ "reasoning": string, "suggestion": string, "confidence": "low"|"medium"|"high", "disclaimer": string }
No text outside the JSON object.`;

function buildPrompt(task: string, context: Record<string, unknown>): string {
  switch (task) {
    case 'missed_dose_advice':
      return `Medicine: ${context.medicineName} ${context.strength}${context.unit}
Scheduled: ${context.scheduledTime} | Now: ${context.currentTime} | Next dose: ${context.nextDoseTime}
Hours since missed: ${context.hoursSinceMissed} | Instructions: ${context.instructions ?? 'none'}
Should the patient take the missed dose now, or skip it?`;

    case 'draft_caregiver_message':
      return `Patient: ${context.patientName}. Adherence today: ${context.adherencePercent}%.
Total doses: ${context.totalDoses ?? 'N/A'}. Taken: ${context.takenDoses ?? 'N/A'}.
Missed doses: ${JSON.stringify(context.missedDoses)}.
Draft a concise, reassuring caregiver update message.`;

    default:
      return 'Summarize medication status as JSON.';
  }
}

async function callWithRetry(prompt: string, retries = 2): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: SYSTEM_PROMPT,
  });

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 429 && attempt < retries) {
        await new Promise((r) => setTimeout(r, (attempt + 1) * 3000));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}

export async function POST(req: NextRequest) {
  try {
    const { task, context } = await req.json();
    if (!task || !context) {
      return NextResponse.json({ error: 'Missing task or context' }, { status: 400 });
    }

    const raw = await callWithRetry(buildPrompt(task, context));
    const clean = raw.replace(/```json\n?|```/g, '').trim();
    return NextResponse.json(JSON.parse(clean));
  } catch (err) {
    console.error('[AI Route]', err);
    return NextResponse.json({ error: 'AI unavailable' }, { status: 503 });
  }
}
