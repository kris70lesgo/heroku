import { useEffect, useRef, useState } from "react";
import { Paperclip, Send, Upload } from "lucide-react";

interface Msg { role: "user" | "assistant" | "system"; content: string; id: string; sources?: { title: string; url?: string }[] }

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([
    { id: "m1", role: "assistant", content: "I'm Study Buddy, your AI tutor. Ask subject questions, share files for context, and I'll cite sources.", sources: [] },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: input.trim() } as Msg;
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messages: [...messages, userMsg].map(({ role, content }) => ({ role, content })) }),
      });
      const isJson = res.headers.get("content-type")?.includes("application/json");
      const payload: any = isJson ? await res.json() : await res.text();
      if (!res.ok) throw new Error((payload && payload.error) || (typeof payload === "string" ? payload : "AI error"));
      const content = typeof payload === "string" ? payload : payload?.message?.content || "";
      const assistant: Msg = { id: crypto.randomUUID(), role: "assistant", content } as Msg;
      setMessages((m) => [...m, assistant]);
    } catch (e: any) {
      const assistant: Msg = { id: crypto.randomUUID(), role: "assistant", content: e.message || "AI request failed" } as Msg;
      setMessages((m) => [...m, assistant]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] grid grid-rows-[1fr_auto]">
      <div ref={listRef} className="overflow-y-auto pr-1">
        <div className="max-w-3xl mx-auto py-6 space-y-4">
          {messages.map((m) => (
            <MessageBubble key={m.id} msg={m} />
          ))}
          {typing && (
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-indigo-500" />
              <div className="px-3 py-2 rounded-2xl bg-background border">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t bg-card p-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2">
            <button className="p-2 rounded-md border hover:bg-accent" aria-label="Attach file">
              <Paperclip className="h-5 w-5" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask a question… Supports math, code, and citations"
              rows={2}
              className="flex-1 resize-none rounded-md border bg-background p-3 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button onClick={send} className="px-4 py-2 rounded-md bg-primary text-primary-foreground inline-flex items-center gap-2">
              Send <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Context-aware answers when you upload files. Responses may cite your sources.
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`h-8 w-8 rounded-full ${isUser ? "bg-gradient-to-br from-indigo-500 to-primary" : "bg-gradient-to-br from-primary to-indigo-500"}`} />
      <div className={`max-w-[80%] px-3 py-2 rounded-2xl ${isUser ? "bg-primary text-primary-foreground" : "bg-background border"}`}>
        <div className="whitespace-pre-wrap">{msg.content}</div>
        {msg.sources && msg.sources.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            Sources: {msg.sources.map((s, i) => (
              <a key={i} href={s.url || "#"} className="underline hover:text-primary">{s.title}</a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
