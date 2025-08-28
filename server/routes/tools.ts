import type { Request, Response } from "express";

export interface ScheduleGeneratorInput {
  courses: { name: string; topics?: string[] }[];
  deadlines: { course: string; date: string }[];
  available_hours: number; // per week
  learning_style?: string;
  priority_subjects?: string[];
}

export interface QuizGeneratorInput {
  extracted_text: string;
  question_count: number;
  difficulty_level: "easy" | "medium" | "hard";
  question_types: ("multiple_choice" | "short_answer" | "essay")[];
  subject?: string;
  topic?: string;
}

export async function scheduleGenerator(req: Request, res: Response) {
  const body = req.body as ScheduleGeneratorInput;
  if (!body?.courses?.length || typeof body.available_hours !== "number") {
    return res.status(400).json({ error: "Invalid input" });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const prompt = `You are Study Buddy, an expert study planner. Create an optimal weekly schedule with time blocks given the inputs. Output strict JSON with keys: schedule{view:"weekly", days:[{day:string, blocks:[{course:string, duration:number, milestone:string}]}]}, milestones:[{course,next:string[],deadline:string|null}], meta{generatedAt:number,strategy:string}. Inputs: ${JSON.stringify(
        body,
      )}`;
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(
          geminiKey,
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { response_mime_type: "application/json" } }),
        },
      );
      const text = await r.text();
      if (!r.ok) return res.status(502).json({ error: `Gemini error: ${text}` });
      let json = safeJson(text);
      if (!json) {
        try {
          const data = JSON.parse(text);
          const outText = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).join("\n") ?? "";
          json = safeJson(outText);
        } catch {}
      }
      if (json) return res.json(json);
    } catch (e: any) {
      // fall through to local algorithm
    }
  }

  // Local fallback algorithm
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hoursPerDay = Math.max(1, Math.round(body.available_hours / 5));
  const priorities = new Set(body.priority_subjects ?? []);
  const weighted = body.courses.map((c) => ({ name: c.name, weight: priorities.has(c.name) ? 2 : 1 }));
  const totalWeight = weighted.reduce((a, b) => a + b.weight, 0) || 1;
  const dailyBlocks = weekDays.map((d) => ({ day: d, blocks: [] as { course: string; duration: number; milestone?: string }[] }));
  for (const day of dailyBlocks) {
    let remaining = hoursPerDay;
    for (const c of weighted) {
      const share = Math.max(1, Math.round((c.weight / totalWeight) * hoursPerDay));
      const duration = Math.min(remaining, share);
      if (duration <= 0) continue;
      remaining -= duration;
      day.blocks.push({ course: c.name, duration, milestone: `Focus on key topic for ${c.name}` });
      if (remaining <= 0) break;
    }
    if (remaining > 0 && day.blocks.length > 0) dailyBlocks[dailyBlocks.length - 1]?.blocks?.length && (day.blocks[day.blocks.length - 1].duration += remaining);
  }
  const milestones = generateMilestones(body.courses, body.deadlines);
  return res.json({ schedule: { view: "weekly", days: dailyBlocks }, milestones, meta: { generatedAt: Date.now(), strategy: "fallback_proportional" } });
}

export async function quizGenerator(req: Request, res: Response) {
  const body = req.body as QuizGeneratorInput;
  if (!body?.question_count || !Array.isArray(body.question_types)) {
    return res.status(400).json({ error: "Invalid input" });
  }
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return res.status(501).json({ error: "GEMINI_API_KEY not set" });
  try {
    const [derivedSubject, derivedTopic] = deriveSubjectTopic(body.extracted_text || "");
    const subject = body.subject || derivedSubject;
    const topic = body.topic || derivedTopic;
    const prompt = `You are Study Buddy, an expert quiz generator. Given Subject and Topic below, generate exactly ${body.question_count} varied multiple-choice questions (no duplicates).
- Do NOT echo instructions or meta text in questions.
- Keep options concise and non-redundant; exactly 4 options per question, one correct.
- Avoid repeating identical wording across questions; cover definitions, applications, examples, misconceptions.
- Output ONLY strict JSON with schema:
{ "questions": [ { "id": string, "type": "multiple_choice", "prompt": string, "options": string[4], "correct_answers": string[1], "explanations": string } ], "meta": { "difficulty": "${body.difficulty_level}", "count": ${body.question_count} } }
Subject: ${subject}
Topic: ${topic}`;

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" },
      }) },
    );
    const txt = await r.text();
    if (!r.ok) return res.status(502).json({ error: `Gemini error: ${txt}` });
    let json = safeJson(txt);
    if (!json) {
      try {
        const data = JSON.parse(txt);
        const outText = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).join("\n") ?? "";
        json = safeJson(outText);
      } catch {}
    }
    if (!json || !Array.isArray(json.questions) || json.questions.length === 0) {
      const [subject, topic] = [subjectFrom(body), topicFrom(body)];
      const questions = localQuizFallback(subject, topic, body.question_count || 10, body.difficulty_level);
      return res.json({ questions, meta: { difficulty: body.difficulty_level, count: questions.length } });
    }
    // Post-process to clean and deduplicate
    json.questions = cleanQuiz(json.questions, subjectFrom(body), topicFrom(body), body.question_count || 10);
    return res.json(json);
  } catch (e: any) {
    const questions = localQuizFallback(subjectFrom(body), topicFrom(body), body.question_count || 10, body.difficulty_level);
    return res.json({ questions, meta: { difficulty: body.difficulty_level, count: questions.length } });
  }
}

function generateMilestones(courses: { name: string; topics?: string[] }[], deadlines: { course: string; date: string }[]) {
  return courses.map((c) => {
    const dl = deadlines.find((d) => d.course === c.name)?.date;
    return { course: c.name, next: c.topics?.slice(0, 3) ?? ["Review notes", "Practice problems", "Self-quiz"], deadline: dl ?? null };
  });
}

function safeJson(text: string): any | null {
  try {
    const match = text.match(/\{[\s\S]*\}$/);
    const raw = match ? match[0] : text;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function deriveSubjectTopic(text: string): [string, string] {
  const subj = /Subject:\s*([^\n]+)/i.exec(text)?.[1]?.trim() || /subject\s+([^\.\n]+)/i.exec(text)?.[1]?.trim() || "Subject";
  const top = /Topic:\s*([^\n]+)/i.exec(text)?.[1]?.trim() || /topic\s+([^\.\n]+)/i.exec(text)?.[1]?.trim() || "Topic";
  return [subj, top];
}

function subjectFrom(b: QuizGeneratorInput) { return (b.subject || deriveSubjectTopic(b.extracted_text || "")[0]) || "Subject"; }
function topicFrom(b: QuizGeneratorInput) { return (b.topic || deriveSubjectTopic(b.extracted_text || "")[1]) || "Topic"; }

function cleanQuiz(raw: any[], subject: string, topic: string, count: number) {
  const seenQ = new Set<string>();
  function sanitizePrompt(p: string) {
    return (p || "")
      .replace(/include 4 options.*$/i, "")
      .replace(/provide correct_answers.*$/i, "")
      .replace(/\s+/g, " ")
      .replace(/\s+\./g, ".")
      .trim();
  }
  function uniqOptions(opts: string[], correct: string) {
    const out: string[] = [];
    const set = new Set<string>();
    for (const o of opts || []) {
      const t = (o || "").trim();
      if (!t) continue;
      const key = t.toLowerCase();
      if (!set.has(key)) { set.add(key); out.push(t); }
    }
    while (out.length < 4) {
      const filler = generateDistractor(topic, subject, out.length);
      if (!set.has(filler.toLowerCase())) { set.add(filler.toLowerCase()); out.push(filler); }
    }
    if (!out.includes(correct)) {
      out[0] = correct;
    }
    return out.slice(0, 4);
  }
  const cleaned = [] as any[];
  for (const q of raw) {
    let prompt = sanitizePrompt(q.prompt || q.question || "");
    if (!prompt) continue;
    const key = prompt.toLowerCase();
    if (seenQ.has(key)) continue;
    seenQ.add(key);
    const correct = (q.correct_answers?.[0] || q.answer || "").toString().trim() || `${topic} relates to ${subject}`;
    const options = uniqOptions(q.options || [], correct);
    cleaned.push({ id: q.id || `q${cleaned.length + 1}`, type: "multiple_choice", prompt, options, correct_answers: [correct], explanations: q.explanations || "" });
    if (cleaned.length >= count) break;
  }
  while (cleaned.length < count) {
    const i = cleaned.length + 1;
    const base = localQuestionTemplate(subject, topic, i);
    cleaned.push(base);
  }
  return cleaned;
}

function localQuizFallback(subject: string, topic: string, count: number, difficulty: string) {
  const qs = [] as any[];
  for (let i = 1; i <= count; i++) qs.push(localQuestionTemplate(subject, topic, i));
  return qs;
}

function localQuestionTemplate(subject: string, topic: string, i: number) {
  const templates = [
    `Which statement about ${topic} in ${subject} is most accurate?`,
    `Which example best illustrates ${topic} in ${subject}?`,
    `Which formula/fact is associated with ${topic} in ${subject}?`,
    `Which misconception about ${topic} in ${subject} is FALSE?`,
    `Which application uses ${topic} most directly in ${subject}?`,
  ];
  const prompt = templates[(i - 1) % templates.length];
  const opts = [
    `${topic} relates to ${subject} fundamentals`,
    `${topic} is unrelated to ${subject}`,
    `${topic} only appears in biology`,
    `${topic} cannot be measured`,
  ];
  const correct = opts[0];
  return { id: `q${i}`, type: "multiple_choice", prompt, options: opts, correct_answers: [correct], explanations: `${topic} is foundational within ${subject}.` };
}

function generateDistractor(topic: string, subject: string, n: number) {
  const pool = [
    `${topic} is unrelated to ${subject}`,
    `${topic} only appears in biology`,
    `${topic} cannot be measured`,
    `${topic} is purely historical`,
    `${topic} is always random`,
    `${topic} has no real-world uses`,
  ];
  return pool[n % pool.length];
}
