"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles } from "lucide-react";
import { AnalyticsResponse } from "@/lib/data/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Who in finance is spending the most time on email triage, and how much does it cost us per month?",
  "What's the single highest-ROI automation we should ship next quarter?",
  "Show me everyone whose repetitive-task share went up week-over-week."
];

async function readSseStream(
  response: Response,
  onDelta: (text: string) => void
): Promise<{ error?: string }> {
  const reader = response.body?.getReader();
  if (!reader) return { error: "No response stream from assistant." };

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      try {
        const payload = JSON.parse(trimmed.slice(5).trim()) as { delta?: string; error?: string; done?: boolean };
        if (payload.error) return { error: payload.error };
        if (payload.delta) onDelta(payload.delta);
      } catch {
        // ignore
      }
    }
  }
  return {};
}

export function AssistantPanel({ data }: { data: AnalyticsResponse }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    fetch("/api/assistant")
      .then((res) => res.json())
      .then((body: { configured?: boolean }) => setConfigured(Boolean(body.configured)))
      .catch(() => setConfigured(false));
  }, []);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    if (configured === false) {
      setError("Missing LLM_API_KEY. Add it to .env.local and restart npm run dev.");
      return;
    }

    setError(null);
    const nextMessages: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          filters: data.activeFilters,
          stream: true
        })
      });

      const contentType = response.headers.get("content-type") ?? "";

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Assistant request failed.");
      }

      if (contentType.includes("text/event-stream")) {
        const streamResult = await readSseStream(response, (delta) => {
          setMessages((previous) => {
            const copy = [...previous];
            const last = copy[copy.length - 1];
            if (last?.role === "assistant") {
              copy[copy.length - 1] = { role: "assistant", content: last.content + delta };
            }
            return copy;
          });
        });
        if (streamResult.error) throw new Error(streamResult.error);
        setMessages((previous) => {
          const copy = [...previous];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant" && !last.content.trim()) {
            copy[copy.length - 1] = {
              role: "assistant",
              content: "No answer was generated. Try rephrasing your question."
            };
          }
          return copy;
        });
      } else {
        const body = (await response.json()) as { answer?: string };
        setMessages([...nextMessages, { role: "assistant", content: body.answer ?? "No answer generated." }]);
      }
    } catch (err) {
      setMessages(nextMessages);
      setError(err instanceof Error ? err.message : "Assistant failed.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <Card className="overflow-hidden border-accent-cyan/10">
      <SectionHeader
        title="Grounded AI assistant"
        description="Direct LLM API · normalized dataset only · multi-turn follow-ups supported · citations required on every number."
        action={
          <div className="inline-flex items-center gap-1.5 rounded-full border border-accent-cyan/25 bg-accent-cyan/10 px-3 py-1 text-xs font-semibold text-accent-cyan">
            <Bot size={14} aria-hidden /> COO mode
          </div>
        }
      />

      {configured === false ? (
        <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          Add <code className="text-amber-100">LLM_API_KEY</code> to <code className="text-amber-100">.env.local</code> to
          enable the assistant. The rest of the dashboard works without it.
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={loading || configured === false}
            onClick={() => sendMessage(suggestion)}
            className="rounded-xl border border-border bg-canvas/50 px-3 py-2.5 text-left text-xs leading-relaxed text-muted transition hover:border-accent-cyan/30 hover:bg-accent-cyan/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
          >
            <Sparkles size={12} className="mb-1 inline text-accent-cyan" aria-hidden /> {suggestion}
          </button>
        ))}
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-thin mt-4 max-h-80 space-y-3 overflow-y-auto rounded-2xl border border-border bg-canvas/60 p-3 sm:max-h-96 sm:p-4"
        aria-live="polite"
        aria-busy={loading}
      >
        {messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            Try a suggested question, then follow up (e.g. &quot;and break that down by department&quot;).
          </p>
        ) : null}
        {messages.map((message, index) => (
          <div
            key={`${index}-${message.role}`}
            className={`rounded-2xl p-3 text-sm leading-relaxed sm:p-4 ${
              message.role === "user"
                ? "ml-4 border border-accent-cyan/20 bg-accent-cyan/10 text-foreground sm:ml-12"
                : "mr-4 border border-border bg-surface-elevated text-foreground/90 sm:mr-12"
            }`}
          >
            <p className="whitespace-pre-wrap">{message.content || (loading && index === messages.length - 1 ? "…" : "")}</p>
          </div>
        ))}
      </div>

      {error ? (
        <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={loading || configured === false}
          placeholder="Ask a follow-up, e.g. break that down by department…"
          className="min-w-0 flex-1 rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground shadow-sm transition placeholder:text-muted focus:border-accent-cyan/50 focus:outline-none focus:ring-2 focus:ring-accent-cyan/20 disabled:opacity-50"
        />
        <Button type="submit" disabled={loading || configured === false} className="w-full shrink-0 sm:w-auto">
          {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Send size={16} aria-hidden />}
          {loading ? "Sending…" : "Send"}
        </Button>
      </form>
    </Card>
  );
}
