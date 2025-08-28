import { useMemo } from "react";
import { ArrowDown, ArrowUp, Download } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, RadialBar, RadialBarChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";

const weekly = Array.from({ length: 12 }, (_, i) => ({
  week: `W${i + 1}`,
  hours: Math.round(6 + Math.sin(i / 1.7) * 2 + (i > 6 ? 1 : 0) + Math.random() * 1.5),
  score: Math.round(60 + i * 2 + (Math.random() * 6 - 3)),
}));

const mastery = [
  { subject: "Math", mastery: 84 },
  { subject: "Physics", mastery: 78 },
  { subject: "Chemistry", mastery: 71 },
  { subject: "Biology", mastery: 65 },
  { subject: "History", mastery: 73 },
];

const allocation = [
  { name: "Reading", value: 18 },
  { name: "Practice", value: 34 },
  { name: "Projects", value: 16 },
  { name: "Revision", value: 14 },
  { name: "Quizzes", value: 18 },
];

export default function Progress() {
  const avgHours = useMemo(() => Math.round(weekly.reduce((a, b) => a + b.hours, 0) / weekly.length), []);
  const latest = weekly[weekly.length - 1];
  const prev = weekly[weekly.length - 2];
  const delta = latest.hours - prev.hours;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Avg. weekly hours" value={`${avgHours}h`} delta={delta} />
        <StatCard title="Current mastery" value={`${masteryAvg(mastery)}%`} delta={Math.round((masteryAvg(mastery) - 70) / 2)} />
        <StatCard title="Learning streak" value={`12 days`} delta={2} />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Weekly progress</h2>
            <button className="text-sm px-2 py-1 rounded-md border hover:bg-accent inline-flex items-center gap-2"><Download className="h-4 w-4" /> Export CSV</button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly} margin={{ left: -20, right: 10 }}>
                <defs>
                  <linearGradient id="p1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="p2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(243.4 75.4% 58.6%)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(243.4 75.4% 58.6%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Area type="monotone" dataKey="hours" name="Hours" stroke="hsl(var(--primary))" fill="url(#p1)" strokeWidth={2} />
                <Area type="monotone" dataKey="score" name="Score" stroke="hsl(243.4 75.4% 58.6%)" fill="url(#p2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold mb-3">Time allocation</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Pie data={allocation} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} stroke="none" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-xl border bg-card p-4">
          <h2 className="font-semibold mb-3">Subject mastery</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mastery}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="subject" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="mastery" name="Mastery %" fill="hsl(var(--primary))" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold mb-3">Streak progress</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="60%" outerRadius="100%" data={[{ name: "Streak", value: 12, fill: "hsl(var(--primary))" }, { name: "Goal", value: 30, fill: "hsl(0 0% 90%)" }]} startAngle={180} endAngle={-180}>
                <RadialBar dataKey="value" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-sm text-muted-foreground -mt-2">12-day streak towards 30-day goal</div>
        </div>
      </section>
    </div>
  );
}

function masteryAvg(list: { mastery: number }[]) {
  return Math.round(list.reduce((a, b) => a + b.mastery, 0) / list.length);
}

function StatCard({ title, value, delta }: { title: string; value: string; delta: number }) {
  const up = delta >= 0;
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      <div className={`mt-1 inline-flex items-center gap-1 text-sm ${up ? "text-green-600" : "text-red-600"}`}>
        {up ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />} {Math.abs(delta)} {title.includes("hours") ? "h" : "%"}
      </div>
    </div>
  );
}
