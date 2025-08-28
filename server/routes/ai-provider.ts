import type { Request, Response } from "express";
import { chat as geminiChat } from "./ai";
import { herokuChat } from "./heroku-ai";

interface Msg { role: "user" | "assistant" | "system"; content: string }

export async function aiProviderChat(req: Request, res: Response) {
  const { messages, provider = "auto" } = (req.body ?? {}) as { 
    messages: Msg[]; 
    provider?: "gemini" | "heroku" | "auto" 
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array required" });
  }

  // Auto-select provider based on availability
  if (provider === "auto") {
    const hasGemini = !!process.env.GEMINI_API_KEY;
    const hasHeroku = !!(process.env.HEROKU_INFERENCE_URL && process.env.HEROKU_INFERENCE_KEY && process.env.HEROKU_INFERENCE_MODEL_ID);
    
    if (hasHeroku) {
      // Prefer Heroku AI if available
      return herokuChat(req, res);
    } else if (hasGemini) {
      return geminiChat(req, res);
    } else {
      return res.status(501).json({ 
        error: "No AI providers configured. Set up Gemini or Heroku AI credentials." 
      });
    }
  }

  // Use specific provider
  if (provider === "heroku") {
    return herokuChat(req, res);
  } else if (provider === "gemini") {
    return geminiChat(req, res);
  }

  return res.status(400).json({ error: "Invalid provider. Use 'gemini', 'heroku', or 'auto'" });
}
