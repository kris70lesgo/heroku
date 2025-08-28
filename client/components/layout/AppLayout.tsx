import { Link, NavLink, Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Topbar />
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </main>
          <footer className="border-t bg-card text-card-foreground px-6 py-3 text-sm flex items-center justify-between">
            <span>© {new Date().getFullYear()} Study Buddy AI Assistant</span>
            <div className="space-x-4 hidden sm:block">
              <Link to="/privacy" className="hover:underline">Privacy</Link>
              <Link to="/terms" className="hover:underline">Terms</Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
