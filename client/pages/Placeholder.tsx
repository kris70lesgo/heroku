import { Link } from "react-router-dom";

export default function Placeholder({ title, description }: { title: string; description?: string }) {
  return (
    <div className="min-h-[60vh] grid place-items-center">
      <div className="text-center max-w-xl">
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="text-muted-foreground mt-2">{description}</p>}
        <p className="text-sm text-muted-foreground mt-4">Tell me what you want here and I'll build it. Meanwhile, explore the Dashboard and Chat.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/dashboard" className="px-3 py-2 rounded-md border hover:bg-accent">Go to Dashboard</Link>
          <Link to="/chat" className="px-3 py-2 rounded-md bg-primary text-primary-foreground">Open Chat</Link>
        </div>
      </div>
    </div>
  );
}
