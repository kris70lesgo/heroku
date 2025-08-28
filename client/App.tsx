import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Placeholder from "./pages/Placeholder";
import Planner from "./pages/Planner";
import Quiz from "./pages/Quiz";
import Progress from "./pages/Progress";
import { AppLayout } from "./components/layout/AppLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/uploads" element={<Placeholder title="Uploads" description="Upload PDFs, DOCX, TXT, and images with OCR to power RAG." />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/settings" element={<Placeholder title="Settings" description="Manage profile, preferences, and integrations (Gemini, Heroku AI)." />} />
            <Route path="/privacy" element={<Placeholder title="Privacy" />} />
            <Route path="/terms" element={<Placeholder title="Terms" />} />
          </Route>
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
