"use client";

import { useState } from "react";

type Message = { role: "user" | "assistant"; text: string };

const SUGGESTIONS = ["Where is my order?", "How do I cancel?", "When will I get a refund?"];

export default function SupportChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);

  async function ask(text: string) {
    if (text.trim().length < 2) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setQuestion("");
    setPending(true);

    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: text }),
    });
    const body = (await res.json().catch(() => ({}))) as { answer?: string; error?: string };
    setPending(false);
    setMessages((m) => [
      ...m,
      { role: "assistant", text: body.answer ?? body.error ?? "Something went wrong." },
    ]);
  }

  return (
    <div className="space-y-3">
      <div className="min-h-48 space-y-3 rounded-lg border bg-white p-4">
        {messages.length === 0 && (
          <p className="text-sm text-neutral-500">Ask about an order, cancellation or refund.</p>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={message.role === "user" ? "text-right" : "text-left"}
          >
            <span
              className={`inline-block whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                message.role === "user" ? "bg-neutral-900 text-white" : "bg-neutral-100"
              }`}
            >
              {message.text}
            </span>
          </div>
        ))}
        {pending && <p className="text-sm text-neutral-500">Thinking…</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => void ask(suggestion)}
            disabled={pending}
            className="rounded-full border bg-white px-3 py-1 text-xs hover:bg-neutral-100 disabled:opacity-40"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
        className="flex gap-2"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type your question"
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
