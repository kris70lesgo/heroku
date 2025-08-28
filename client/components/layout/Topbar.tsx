import { Bell, Menu, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export function Topbar() {
  const [q, setQ] = useState("");
  return (
    <header className="h-14 border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/70 sticky top-0 z-40">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center gap-3">
        <button className="md:hidden p-2 rounded hover:bg-accent" aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/dashboard" className="md:hidden font-semibold bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">Study Buddy</Link>
        <div className="relative max-w-xl w-full ml-auto md:ml-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search chats, notes, quizzes..."
            className="w-full pl-9 pr-3 py-2 rounded-md bg-muted/60 focus:bg-background border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>
        <button className="ml-auto md:ml-0 p-2 rounded hover:bg-accent" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </button>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-indigo-500" />
      </div>
    </header>
  );
}
