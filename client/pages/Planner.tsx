import { useMemo, useState } from "react";
import { Calendar, Clock, ListChecks, Sparkles } from "lucide-react";

type Course = { name: string; topics?: string };

type ApiSchedule = {
  schedule: { view: string; days: { day: string; blocks: { course: string; duration: number; milestone?: string }[] }[] };
  milestones: { course: string; next: string[]; deadline: string | null }[];
  meta: { generatedAt: number; strategy: string };
};

export default function Planner() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [courses, setCourses] = useState<Course[]>([{ name: "Mathematics" }, { name: "Physics" }]);
  const [deadlines, setDeadlines] = useState<{ course: string; date: string }[]>([]);
  const [hoursMode, setHoursMode] = useState<"weekly" | "daily">("weekly");
  const [weeklyHours, setWeeklyHours] = useState<number>(12);
  const [dailyHours, setDailyHours] = useState<number>(2);
  const [style, setStyle] = useState<string>("mix");
  const [priority, setPriority] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<ApiSchedule | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableHours = hoursMode === "weekly" ? weeklyHours : dailyHours * 5;
  const prioritySubjects = useMemo(() =>
    priority.split(",").map((s) => s.trim()).filter(Boolean),
  [priority]);

  const submit = async () => {
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const body = {
        courses: courses.map((c) => ({ name: c.name, topics: c.topics?.split(",").map((t) => t.trim()).filter(Boolean) })),
        deadlines,
        available_hours: availableHours,
        learning_style: style,
        priority_subjects: prioritySubjects,
      };
      const res = await fetch("/api/tools/schedule_generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const ct = res.headers.get("content-type") || "";
      const raw = await res.text();
      const data = ct.includes("application/json") ? JSON.parse(raw) : safeParse(raw);
      if (!res.ok) throw new Error((data && (data as any).error) || raw || "Failed to generate plan");
      setPlan(data as ApiSchedule);
      setStep(3);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {step === 1 && (
        <section className="rounded-xl border bg-card overflow-hidden">
          <div className="p-6 grid gap-6 lg:grid-cols-3 items-center">
            <div className="lg:col-span-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Build your personalized study plan</h1>
              <p className="text-muted-foreground mt-2">Answer a few quick questions and Gemini will generate a dynamic weekly schedule with smart priorities, buffer times, and reviews.</p>
              <ul className="mt-4 text-sm space-y-2">
                <li className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Adapts to deadlines and strengths</li>
                <li className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Calendar and task list views</li>
                <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Breaks and practice sessions</li>
              </ul>
              <button onClick={() => setStep(2)} className="mt-6 px-4 py-2 rounded-md bg-primary text-primary-foreground">Get started</button>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <div className="text-sm font-medium">What you'll need</div>
              <ul className="mt-3 text-sm text-muted-foreground list-disc pl-5 space-y-1">
                <li>Subjects/topics</li>
                <li>Deadlines (exams, assignments)</li>
                <li>Available hours per day or week</li>
                <li>Preferred study style</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold">Tell us about your studies</h2>
          {error && <div className="mt-2 text-sm text-destructive">{error}</div>}

          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="font-medium">Subjects and topics</div>
              {courses.map((c, i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <input value={c.name} onChange={(e) => updateCourse(i, { ...c, name: e.target.value })} placeholder="Subject (e.g., Calculus)" className="px-3 py-2 rounded-md border bg-background" />
                  <input value={c.topics ?? ""} onChange={(e) => updateCourse(i, { ...c, topics: e.target.value })} placeholder="Topics (comma separated)" className="px-3 py-2 rounded-md border bg-background" />
                </div>
              ))}
              <div className="flex gap-2">
                <button onClick={() => setCourses([...courses, { name: "" }])} className="px-3 py-2 rounded-md border">Add subject</button>
                <button onClick={() => courses.length > 1 && setCourses(courses.slice(0, -1))} className="px-3 py-2 rounded-md border">Remove last</button>
              </div>

              <div className="font-medium mt-4">Deadlines</div>
              <div className="space-y-2">
                {deadlines.map((d, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2">
                    <input value={d.course} onChange={(e) => updateDeadline(i, { ...d, course: e.target.value })} placeholder="Course" className="px-3 py-2 rounded-md border bg-background" />
                    <input type="date" value={d.date} onChange={(e) => updateDeadline(i, { ...d, date: e.target.value })} className="px-3 py-2 rounded-md border bg-background" />
                  </div>
                ))}
                <div className="flex gap-2">
                  <button onClick={() => setDeadlines([...deadlines, { course: "", date: "" }])} className="px-3 py-2 rounded-md border">Add deadline</button>
                  <button onClick={() => deadlines.length > 0 && setDeadlines(deadlines.slice(0, -1))} className="px-3 py-2 rounded-md border">Remove last</button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="font-medium">Available study time</div>
                <div className="mt-2 flex items-center gap-3 text-sm">
                  <label className="inline-flex items-center gap-2"><input type="radio" checked={hoursMode === "weekly"} onChange={() => setHoursMode("weekly")} /> Weekly</label>
                  <label className="inline-flex items-center gap-2"><input type="radio" checked={hoursMode === "daily"} onChange={() => setHoursMode("daily")} /> Daily</label>
                </div>
                {hoursMode === "weekly" ? (
                  <input type="number" min={1} value={weeklyHours} onChange={(e) => setWeeklyHours(parseFloat(e.target.value))} className="mt-2 w-40 px-3 py-2 rounded-md border bg-background" />
                ) : (
                  <input type="number" min={1} value={dailyHours} onChange={(e) => setDailyHours(parseFloat(e.target.value))} className="mt-2 w-40 px-3 py-2 rounded-md border bg-background" />
                )}
              </div>

              <div>
                <div className="font-medium">Preferred study style</div>
                <select value={style} onChange={(e) => setStyle(e.target.value)} className="mt-2 px-3 py-2 rounded-md border bg-background">
                  <option value="short">Short sessions</option>
                  <option value="deep">Deep focus</option>
                  <option value="mix">Mix</option>
                </select>
              </div>

              <div>
                <div className="font-medium">Priority subjects</div>
                <input value={priority} onChange={(e) => setPriority(e.target.value)} placeholder="e.g., Physics, Chemistry" className="mt-2 w-full px-3 py-2 rounded-md border bg-background" />
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setStep(1)} className="px-3 py-2 rounded-md border">Back</button>
                <button onClick={submit} disabled={loading} className="px-4 py-2 rounded-md bg-primary text-primary-foreground disabled:opacity-70">{loading ? "Generating…" : "Generate plan"}</button>
              </div>
            </div>
          </div>
        </section>
      )}

      {step === 3 && plan && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Your AI-generated study plan</h2>
            <button onClick={() => setStep(2)} className="px-3 py-2 rounded-md border">Adjust inputs</button>
          </div>
          <div className="grid xl:grid-cols-3 gap-6">
            <WeeklyCalendar plan={plan} />
            <TaskList plan={plan} />
          </div>
        </section>
      )}
    </div>
  );

  function updateCourse(i: number, next: Course) {
    const copy = courses.slice();
    copy[i] = next;
    setCourses(copy);
  }
  function updateDeadline(i: number, next: { course: string; date: string }) {
    const copy = deadlines.slice();
    copy[i] = next;
    setDeadlines(copy);
  }
}

function safeParse(t: string) {
  try { return JSON.parse(t); } catch { return null as any; }
}

function WeeklyCalendar({ plan }: { plan: ApiSchedule }) {
  const days = plan.schedule.days;
  return (
    <div className="xl:col-span-2 rounded-xl border bg-card p-4 overflow-auto">
      <div className="grid grid-cols-7 gap-3 min-w-[720px]">
        {days.map((d, idx) => (
          <div key={idx} className="rounded-lg border bg-background p-2">
            <div className="text-sm font-medium mb-2">{d.day}</div>
            <div className="space-y-2">
              {d.blocks.map((b, i) => (
                <div key={i} className="rounded-md border px-3 py-2 bg-accent/30">
                  <div className="text-sm font-medium">{b.course} — {b.duration}h</div>
                  {b.milestone && <div className="text-xs text-muted-foreground">{b.milestone}</div>}
                </div>
              ))}
              {d.blocks.length === 0 && <div className="text-xs text-muted-foreground">No blocks</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskList({ plan }: { plan: ApiSchedule }) {
  const items = plan.schedule.days.flatMap((d) => d.blocks.map((b) => ({ day: d.day, ...b })));
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 mb-3"><ListChecks className="h-4 w-4" /><div className="font-medium">Tasks</div></div>
      <div className="space-y-2 max-h-[520px] overflow-auto pr-2">
        {items.map((x, i) => (
          <div key={i} className="rounded-md border px-3 py-2">
            <div className="text-sm font-medium">{x.course} — {x.duration}h <span className="text-xs text-muted-foreground">({x.day})</span></div>
            {x.milestone && <div className="text-xs text-muted-foreground">{x.milestone}</div>}
          </div>
        ))}
        {items.length === 0 && <div className="text-sm text-muted-foreground">No tasks</div>}
      </div>
    </div>
  );
}
