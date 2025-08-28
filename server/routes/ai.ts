import type { Request, Response } from "express";

interface Msg { role: "user" | "assistant" | "system"; content: string }

export async function chat(req: Request, res: Response) {
  const { messages } = (req.body ?? {}) as { messages: Msg[] };
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array required" });
  }

  if (!geminiKey) {
    return res.status(501).json({ error: "GEMINI_API_KEY not set. Connect provider or set env." });
  }

  try {
    const system = {
      role: "user",
      parts: [
        {
          text:
            "You are Study Buddy AI Assistant, a patient, encouraging study tutor. Provide step-by-step explanations, cite sources when provided, and format math clearly (LaTeX syntax allowed).",
        },
      ],
    } as const;

    const contents = [system, ...messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }))];

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(
        geminiKey,
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      },
    );

    if (!r.ok) {
      const t = await r.text();
      return res.status(502).json({ error: `Gemini error: ${t}` });
    }
    const data = (await r.json()) as any;
    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).join("\n\n") ?? "";

    return res.json({
      message: { role: "assistant", content: text || "(empty response)" },
      citations: [],
      provider: "gemini",
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "AI request failed" });
  }
}
