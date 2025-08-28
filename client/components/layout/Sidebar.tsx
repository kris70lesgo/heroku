import { BookOpen, Calendar, LineChart, ChevronRight, Files, Home, MessageCircle, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/planner", label: "Study Planner", icon: Calendar },
  { to: "/quiz", label: "Quizzes", icon: BookOpen },
  { to: "/uploads", label: "Uploads", icon: Files },
  { to: "/progress", label: "Progress", icon: LineChart },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r bg-sidebar text-sidebar-foreground">
      <div className="h-14 border-b px-4 flex items-center font-semibold tracking-tight">
        <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">Study Buddy</span>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/70"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm">{item.label}</span>
              <ChevronRight className="h-4 w-4 ml-auto opacity-40" />
            </NavLink>
          );
        })}
      </nav>
      <div className="p-3 border-t text-xs text-muted-foreground">
        <NavLink to="/settings" className="flex items-center gap-2 px-2 py-2 rounded hover:bg-sidebar-accent/70">
          <Settings className="h-4 w-4" /> Settings
        </NavLink>
      </div>
    </aside>
  );
}
