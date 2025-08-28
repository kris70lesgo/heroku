import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { login, logout, me, register, requireAuth, withCookies } from "./routes/auth";
import { scheduleGenerator, quizGenerator } from "./routes/tools";
import { chat as aiChat } from "./routes/ai";
import { herokuChat } from "./routes/heroku-ai";
import { aiProviderChat } from "./routes/ai-provider";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors({ origin: true, credentials: true }));
  app.use(withCookies);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Auth routes
  app.post("/api/auth/register", register);
  app.post("/api/auth/login", login);
  app.post("/api/auth/logout", logout);
  app.get("/api/auth/me", me);

  // Tools (public for now; add auth when signup is fully wired)
  app.post("/api/tools/schedule_generator", scheduleGenerator);
  app.post("/api/tools/quiz_generator", quizGenerator);

  // AI routes (public for now; add auth when client login is wired)
  app.post("/api/ai/chat", aiProviderChat); // Smart provider selection
  app.post("/api/ai/gemini-chat", aiChat); // Direct Gemini access
  app.post("/api/ai/heroku-chat", herokuChat); // Direct Heroku AI access

  // Example of a protected route
  app.get("/api/protected", requireAuth, (req, res) => {
    res.json({ ok: true, user: (req as any).user });
  });

  return app;
}
