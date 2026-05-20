import { NextRequest, NextResponse } from "next/server";
import { buildAssistantContext } from "@/lib/ai/buildContext";
import { ASSISTANT_SYSTEM_PROMPT } from "@/lib/ai/systemPrompt";
import {
  buildChatPayload,
  ChatMessage,
  getLlmConfig,
  getLlmErrorMessage
} from "@/lib/ai/openai";
import { getAnalytics } from "@/lib/data/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { apiKey, model, baseUrl } = getLlmConfig();
  return NextResponse.json({
    configured: Boolean(apiKey),
    model,
    baseUrl: baseUrl.replace(/\/v1$/, "/***")
  });
}

function buildSystemContent(context: ReturnType<typeof buildAssistantContext>) {
  return `${ASSISTANT_SYSTEM_PROMPT}\n\nAnalytics context JSON:\n${JSON.stringify(context)}`;
}

function sseChunk(payload: object) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export async function POST(req: NextRequest) {
  try {
    const { apiKey, baseUrl } = getLlmConfig();
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing LLM_API_KEY. Add it to .env.local before using the assistant." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const history: ChatMessage[] = (body.messages ?? []).filter(
      (message: ChatMessage) => message.role === "user" || message.role === "assistant"
    );
    const filters = body.filters ?? {};
    const stream = body.stream !== false;

    const analytics = await getAnalytics(filters);
    const context = buildAssistantContext(analytics);
    const systemContent = buildSystemContent(context);

    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildChatPayload(systemContent, history, stream))
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      const llmError = getLlmErrorMessage(upstream.status, text);
      return NextResponse.json({ error: llmError.message }, { status: llmError.status });
    }

    if (!stream || !upstream.body) {
      const result = await upstream.json();
      return NextResponse.json({ answer: result.choices?.[0]?.message?.content ?? "No answer generated." });
    }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const reader = upstream.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const data = trimmed.slice(5).trim();
              if (data === "[DONE]") continue;
              try {
                const json = JSON.parse(data);
                const delta = json.choices?.[0]?.delta?.content;
                if (delta) controller.enqueue(encoder.encode(sseChunk({ delta })));
              } catch {
                // ignore malformed chunks
              }
            }
          }
          controller.enqueue(encoder.encode(sseChunk({ done: true })));
        } catch (error) {
          const message = error instanceof Error ? error.message : "Stream failed.";
          controller.enqueue(encoder.encode(sseChunk({ error: message })));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive"
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Assistant failed to answer." }, { status: 500 });
  }
}
