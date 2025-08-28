import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, FileUp, MessageSquare, PlusCircle, Sparkles, Trophy } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const chartData = Array.from({ length: 12 }, (_, i) => ({
  week: `W${i + 1}`,
  time: Math.round(4 + Math.sin(i / 2) * 2 + Math.random() * 2),
  score: Math.round(65 + i * 2 + Math.random() * 5),
}));

type SafeUser = { id: string; email: string; name: string; gradeLevel?: string; subjects?: string[]; learningGoals?: string };

export default function Dashboard() {
  const [user, setUser] = useState<SafeUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setUser(d?.user ?? null))
      .catch(() => setUser(null));
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border overflow-hidden bg-gradient-to-br from-primary/10 via-indigo-500/10 to-background">
        <div className="p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome{user ? ", " + user.name : " to Study Buddy"}</h1>
            <p className="text-muted-foreground mt-1">Your AI-powered study companion is ready. Plan, chat, and track your progress in one place.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/chat" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground shadow hover:opacity-90">
                <Sparkles className="h-4 w-4" /> Ask a question
              </Link>
              <Link to="/planner" className="inline-flex items-center gap-2 px-4 py-2 rounded-md border hover:bg-accent">
                <Calendar className="h-4 w-4" /> Create study plan
              </Link>
              <Link to="/uploads" className="inline-flex items-center gap-2 px-4 py-2 rounded-md border hover:bg-accent">
                <FileUp className="h-4 w-4" /> Upload notes
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
            <div className="rounded-lg bg-card p-3 border text-center">
              <div className="text-2xl font-bold">12</div>
              <div className="text-xs text-muted-foreground">Study streak</div>
            </div>
            <div className="rounded-lg bg-card p-3 border text-center">
              <div className="text-2xl font-bold">86%</div>
              <div className="text-xs text-muted-foreground">Avg. mastery</div>
            </div>
            <div className="rounded-lg bg-card p-3 border text-center">
              <div className="text-2xl font-bold">14h</div>
              <div className="text-xs text-muted-foreground">This week</div>
            </div>
          </div>
        </div>
      </section>

      {!user && (
        <ProfileSetup onDone={setUser} />
      )}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Progress overview</h2>
            <div className="text-xs text-muted-foreground">Last 12 weeks</div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -20, right: 10 }}>
                <defs>
                  <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(243.4 75.4% 58.6%)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(243.4 75.4% 58.6%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Area type="monotone" dataKey="time" stroke="hsl(var(--primary))" fill="url(#colorTime)" strokeWidth={2} name="Hours" />
                <Area type="monotone" dataKey="score" stroke="hsl(243.4 75.4% 58.6%)" fill="url(#colorScore)" strokeWidth={2} name="Score" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Achievements</h2>
            <Link to="/progress" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-md border">
              <div className="h-10 w-10 rounded-full grid place-items-center bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Streak Master</div>
                <div className="text-xs text-muted-foreground">7-day learning streak</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-md border">
              <div className="h-10 w-10 rounded-full grid place-items-center bg-gradient-to-br from-indigo-500 to-primary text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Planner Pro</div>
                <div className="text-xs text-muted-foreground">Completed weekly schedule</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Quick chat</h2>
            <Link to="/chat" className="text-sm text-primary hover:underline inline-flex items-center gap-1">Open chat <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <QuickChat />
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2"><FileUp className="h-4 w-4" /> Upload notes</h2>
            <Link to="/uploads" className="text-sm text-primary hover:underline">Go to uploads</Link>
          </div>
          <UploadDropzone />
        </div>
      </section>
    </div>
  );
}

function ProfileSetup({ onDone }: { onDone: (u: SafeUser) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState("");
  const [subjects, setSubjects] = useState("");
  const [goals, setGoals] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          email,
          password,
          gradeLevel: grade,
          subjects: subjects.split(",").map((s) => s.trim()).filter(Boolean),
          learningGoals: goals,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to register");
      onDone(data.user);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="font-semibold mb-1">Set up your academic profile</h2>
      <p className="text-sm text-muted-foreground mb-4">Create your account to personalize your dashboard and securely save progress.</p>
      {error && <div className="text-sm text-destructive mb-2">{error}</div>}
      <div className="grid sm:grid-cols-2 gap-3">
        <input className="px-3 py-2 rounded-md border bg-background" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="px-3 py-2 rounded-md border bg-background" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="px-3 py-2 rounded-md border bg-background" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input className="px-3 py-2 rounded-md border bg-background" placeholder="Grade level (e.g., 11th, Freshman)" value={grade} onChange={(e) => setGrade(e.target.value)} />
        <input className="px-3 py-2 rounded-md border bg-background sm:col-span-2" placeholder="Subjects (comma separated)" value={subjects} onChange={(e) => setSubjects(e.target.value)} />
        <input className="px-3 py-2 rounded-md border bg-background sm:col-span-2" placeholder="Learning goals" value={goals} onChange={(e) => setGoals(e.target.value)} />
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={submit} disabled={loading} className="px-4 py-2 rounded-md bg-primary text-primary-foreground disabled:opacity-70">
          {loading ? "Creating…" : "Create account"}
        </button>
        <span className="text-xs text-muted-foreground self-center">JWT cookie-based session. Secure by default.</span>
      </div>
    </section>
  );
}

function QuickChat() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Hi! Ask me anything about your studies. I can explain topics, solve problems, and plan your week." },
  ]);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!text.trim()) return;
    const q = text.trim();
    setText("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setLoading(true);
    // Simulate response; in production, call your AI backend
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Here's a concise explanation and a 3-step plan. We'll also add it to your study schedule. Open Chat for full context-aware answers with citations.",
        },
      ]);
      setLoading(false);
    }, 900);
  };

  return (
    <div className="space-y-3">
      <div className="h-44 overflow-y-auto rounded-md border p-3 bg-muted/30">
        <div className="space-y-2 text-sm">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
              <span
                className={`inline-block px-3 py-2 rounded-lg ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-background border"
                }`}
              >
                {m.content}
              </span>
            </div>
          ))}
          {loading && (
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-background border">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
              </div>
              Typing…
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask anything… e.g., Explain Maxwell's equations"
          className="flex-1 px-3 py-2 rounded-md bg-background border focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button onClick={send} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground">
          Send <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function UploadDropzone() {
  const [hover, setHover] = useState(false);
  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition ${hover ? "border-primary bg-primary/5" : "border-muted"}`}
      onDragOver={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
      }}
    >
      <div className="mx-auto h-14 w-14 rounded-full grid place-items-center bg-muted">
        <FileUp className="h-6 w-6" />
      </div>
      <div className="font-medium mt-3">Drag & drop your notes</div>
      <div className="text-sm text-muted-foreground">PDF, DOCX, TXT, or images</div>
      <button className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-accent">
        <PlusCircle className="h-4 w-4" /> Browse files
      </button>
    </div>
  );
}
