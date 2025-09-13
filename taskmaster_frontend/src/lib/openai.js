//
// OpenAI service for TaskMaster frontend
//
// PUBLIC_INTERFACE
export class OpenAIService {
  /** OpenAI service wrapper using fetch to call chat/completions securely via environment variables. */
  constructor({ apiKey, baseUrl, model } = {}) {
    this.apiKey = apiKey || process.env.REACT_APP_OPENAI_API_KEY || "";
    // Allow override of base url for proxies/self-hosted gateways; default OpenAI
    this.baseUrl = baseUrl || process.env.REACT_APP_OPENAI_BASE_URL || "https://api.openai.com/v1";
    this.model = model || process.env.REACT_APP_OPENAI_MODEL || "gpt-4o-mini";
  }

  get enabled() {
    return Boolean(this.apiKey) && this.baseUrl.startsWith("http");
  }

  // PUBLIC_INTERFACE
  async chat(messages, { temperature = 0.2, max_tokens = 800 } = {}) {
    /**
     * Perform a chat completion request with the given messages.
     * messages: [{ role: "system"|"user"|"assistant", content: string }]
     * Returns: { content: string, usage?: object, raw?: object }
     */
    if (!this.enabled) {
      throw new Error("OpenAI API not configured. Set REACT_APP_OPENAI_API_KEY.");
    }
    const url = `${this.baseUrl}/chat/completions`;
    const body = {
      model: this.model,
      messages,
      temperature,
      max_tokens
    };

    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
    } catch (e) {
      throw new Error(`Network error calling AI: ${e?.message || e}`);
    }

    if (!res.ok) {
      let errMsg = `OpenAI error HTTP ${res.status}`;
      try {
        const data = await res.json();
        if (data?.error?.message) errMsg = `OpenAI error: ${data.error.message}`;
      } catch {
        // ignore parse error
      }
      throw new Error(errMsg);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    return { content, usage: data?.usage, raw: data };
  }
}

// PUBLIC_INTERFACE
export function buildTasksContext(tasks) {
  /** Build a compact textual context from a list of tasks for LLM grounding. */
  const limit = 20;
  const subset = (tasks || []).slice(0, limit);
  const lines = subset.map((t, idx) => {
    const due = t.due_date ? `due:${t.due_date}` : "due:—";
    const desc = t.description ? ` - ${t.description.slice(0, 120)}` : "";
    return `${idx + 1}. [${t.status || "open"}] ${t.title}${desc} (${due}) id:${t.id}`;
  });
  const more = tasks && tasks.length > limit ? `\n… and ${tasks.length - limit} more.` : "";
  return `You are assisting with task management.\nHere are recent tasks:\n${lines.join("\n")}${more}`;
}
