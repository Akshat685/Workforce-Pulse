export function getLlmConfig() {
  return {
    apiKey: process.env.LLM_API_KEY ?? "",
    baseUrl: (process.env.LLM_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""),
    model: process.env.LLM_MODEL ?? "gpt-4o-mini"
  };
}

export function getLlmErrorMessage(status: number, text: string) {
  if (text.includes("insufficient_quota") || text.includes("exceeded your current quota")) {
    return {
      status: 429,
      message:
        "LLM quota is exhausted. Add billing with your provider, use a key with credits, or set LLM_BASE_URL to another OpenAI-compatible provider."
    };
  }

  if (
    status === 403 &&
    (text.includes("doesn't have any credits") ||
      text.includes("does not have permission") ||
      text.includes("console.x.ai"))
  ) {
    return {
      status: 403,
      message:
        "Provider has no credits. Open your provider console, add prepaid credits or a license, then try again. The dashboard works without the assistant until then."
    };
  }

  if (status === 401) {
    return {
      status: 502,
      message: "API key rejected. Check LLM_API_KEY in .env.local and restart the dev server."
    };
  }

  if (status === 429) {
    return {
      status: 429,
      message: "Rate limited by the LLM provider. Wait a moment and try again."
    };
  }

  return {
    status: 502,
    message: `LLM request failed (${status}). ${text.slice(0, 280)}`
  };
}

export type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export function buildChatPayload(systemContent: string, messages: ChatMessage[], stream: boolean) {
  return {
    model: getLlmConfig().model,
    temperature: 0.2,
    stream,
    messages: [{ role: "system", content: systemContent }, ...messages]
  };
}
