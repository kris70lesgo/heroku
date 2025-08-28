import { useEffect, useMemo, useRef, useState } from "react";
import { AlarmClock, CheckCircle2, Loader2, Play, Sparkles, Square, TimerReset } from "lucide-react";

type QuizQuestion = {
  id: string;
  type: "multiple_choice" | "short_answer" | "essay";
  prompt: string;
  options?: string[];
  correct_answers: string[];
  explanations?: string;
};

type QuizPayload = {
  questions: QuizQuestion[];
  meta?: { difficulty?: string; count?: number };
};

export default function Quiz() {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(240); // 4 minutes
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);

  // timer
  useEffect(() => {
    if (!started || finished) return;
    const id = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [started, finished]);

  useEffect(() => {
    if (started && timeLeft === 0 && !finished) {
      endQuiz();
    }
  }, [timeLeft, started, finished]);

  const score = useMemo(() => {
    if (!quiz) return { correct: 0, total: 0 };
    let correct = 0;
    for (const q of quiz) {
      const a = (answers[q.id] ?? "").trim();
      if (!a) continue;
      const set = new Set(q.correct_answers.map((x) => x.trim().toLowerCase()));
      if (set.has(a.trim().toLowerCase())) correct++;
    }
    return { correct, total: quiz.length };
  }, [answers, quiz]);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setQuiz(null);
    setStarted(false);
    setFinished(false);
    setAnswers({});
    setTimeLeft(240);
    try {
      const body = {
        extracted_text: `Subject: ${subject}\nTopic: ${topic}`,
        subject,
        topic,
        question_count: 10,
        difficulty_level: "medium",
        question_types: ["multiple_choice"],
      };
      const res = await fetch("/api/tools/quiz_generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const ct = res.headers.get("content-type") || "";
      const raw = await res.text();
      const data: any = ct.includes("application/json") ? JSON.parse(raw) : safeParse(raw);
      if (!res.ok) throw new Error((data && data.error) || raw || "Failed to generate quiz");
      if (!data?.questions?.length) throw new Error("No questions returned");
      const normalized = (data.questions as QuizQuestion[]).map((q, i) => ({
        id: q.id || `q${i}`,
        type: "multiple_choice" as const,
        prompt: q.prompt,
        options: q.options ?? [],
        correct_answers: q.correct_answers ?? [],
        explanations: (q as any).explanations,
      }));
      setQuiz(normalized.slice(0, 10));
    } catch (e: any) {
      setError(e.message || "Quiz generation failed");
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = () => {
    if (!quiz?.length) return;
    setStarted(true);
    setFinished(false);
    setTimeLeft(240);
  };

  const endQuiz = () => {
    setFinished(true);
    setStarted(false);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-4">
        <h1 className="text-xl font-semibold">Create a quiz</h1>
        <p className="text-sm text-muted-foreground">Enter a subject and topic. We’ll generate 10 multiple-choice questions. Click Start to reveal them and begin a 4-minute timer.</p>
        {error && <div className="mt-2 text-sm text-destructive">{error}</div>}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject (e.g., Physics)" className="px-3 py-2 rounded-md border bg-background" />
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic (e.g., Electromagnetism)" className="px-3 py-2 rounded-md border bg-background" />
          <button onClick={generate} disabled={loading || !subject || !topic} className="px-4 py-2 rounded-md bg-primary text-primary-foreground disabled:opacity-70 inline-flex items-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Generate
          </button>
        </div>
      </section>

      {quiz && (
        <section className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm"><AlarmClock className="h-4 w-4" /> Time left: {formatTime(timeLeft)}</div>
            <div className="flex gap-2">
              {!started && !finished && (
                <button onClick={startQuiz} className="px-3 py-2 rounded-md bg-primary text-primary-foreground inline-flex items-center gap-2"><Play className="h-4 w-4" /> Start</button>
              )}
              {started && (
                <button onClick={endQuiz} className="px-3 py-2 rounded-md border inline-flex items-center gap-2"><Square className="h-4 w-4" /> End quiz</button>
              )}
              {finished && (
                <button onClick={() => { setQuiz(null); setAnswers({}); setFinished(false); setStarted(false); setTimeLeft(240); }} className="px-3 py-2 rounded-md border inline-flex items-center gap-2"><TimerReset className="h-4 w-4" /> New quiz</button>
              )}
            </div>
          </div>

          {!started && !finished && (
            <div className="mt-3 text-sm text-muted-foreground">Click Start to reveal questions and begin the timer.</div>
          )}

          {started && (
            <div className="mt-4 space-y-4">
              {quiz.map((q, i) => (
                <div key={q.id} className="rounded-md border p-3">
                  <div className="font-medium">{i + 1}. {q.prompt}</div>
                  <div className="mt-2 grid gap-2">
                    {(q.options ?? []).map((opt, idx) => (
                      <label key={idx} className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer ${answers[q.id] === opt ? "bg-primary/10 border-primary" : "hover:bg-accent"}`}>
                        <input
                          type="radio"
                          name={q.id}
                          checked={answers[q.id] === opt}
                          onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                        />
                        <span className="text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex justify-end">
                <button onClick={endQuiz} className="px-4 py-2 rounded-md bg-primary text-primary-foreground">Submit</button>
              </div>
            </div>
          )}

          {finished && (
            <div className="mt-4">
              <div className="text-lg font-semibold flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-500" /> Score: {score.correct} / {score.total}</div>
              <div className="mt-3 space-y-3">
                {quiz.map((q, i) => {
                  const user = answers[q.id];
                  const correctSet = new Set(q.correct_answers.map((x) => x.trim().toLowerCase()));
                  const ok = user ? correctSet.has(user.trim().toLowerCase()) : false;
                  const firstCorrect = q.correct_answers[0] ?? "";
                  return (
                    <div key={q.id} className={`rounded-md border p-3 ${ok ? "bg-green-500/5" : "bg-red-500/5"}`}>
                      <div className="font-medium">{i + 1}. {q.prompt}</div>
                      <div className="text-sm">Your answer: <span className={ok ? "text-green-600" : "text-red-600"}>{user || "—"}</span></div>
                      <div className="text-sm">Correct answer: <span className="font-medium">{firstCorrect}</span></div>
                      {q.explanations && <div className="text-xs text-muted-foreground mt-1">{q.explanations}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function safeParse(t: string) {
  try { return JSON.parse(t); } catch { return null as any; }
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
