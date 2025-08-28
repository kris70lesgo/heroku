import type { Request, Response } from "express";

interface Msg { role: "user" | "assistant" | "system"; content: string }

export async function herokuChat(req: Request, res: Response) {
  const { messages } = (req.body ?? {}) as { messages: Msg[] };
  const herokuUrl = process.env.HEROKU_INFERENCE_URL;
  const herokuKey = process.env.HEROKU_INFERENCE_KEY;
  const herokuModel = process.env.HEROKU_INFERENCE_MODEL_ID;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array required" });
  }

  if (!herokuUrl || !herokuKey || !herokuModel) {
    return res.status(501).json({ 
      error: "Heroku AI not configured. Set HEROKU_INFERENCE_URL, HEROKU_INFERENCE_KEY, and HEROKU_INFERENCE_MODEL_ID" 
    });
  }

  try {
    // Convert messages to OpenAI format for Heroku AI
    const openAIMessages = messages.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : msg.role === "system" ? "system" : "user",
      content: msg.content,
    }));

    // Add system instruction for Study Buddy
    const systemMessage = {
      role: "system" as const,
      content: "You are Study Buddy AI Assistant, a patient, encouraging study tutor. Provide step-by-step explanations, cite sources when provided, and format math clearly (LaTeX syntax allowed)."
    };

    const requestBody = {
      model: herokuModel,
      messages: [systemMessage, ...openAIMessages],
      temperature: 0.7,
      max_tokens: 1000,
    };

    const response = await fetch(`${herokuUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${herokuKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(502).json({ error: `Heroku AI error: ${errorText}` });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "(empty response)";

    return res.json({
      message: { role: "assistant", content },
      citations: [],
      provider: "heroku-ai",
      usage: data?.usage,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Heroku AI request failed" });
  }
}
