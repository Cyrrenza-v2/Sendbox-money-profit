import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

type ChatMessage = { role: "user" | "assistant"; content: string };

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors });
}

function cleanHistory(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((m): m is ChatMessage =>
      !!m &&
      typeof m === "object" &&
      ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") &&
      typeof (m as ChatMessage).content === "string"
    )
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
}

function userIdFromJwt(req: Request): string | null {
  const header = req.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "");
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const padded = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded));
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

async function writeAudit(req: Request, model: string, mode: string, message: string, answer: string): Promise<string | null> {
  const userId = userIdFromJwt(req);
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!userId || !serviceKey || !supabaseUrl) {
    console.warn("AI audit skipped: required server context is unavailable.");
    return;
  }

  const auditId = crypto.randomUUID();\n  const response = await fetch(`${supabaseUrl}/rest/v1/ai_analysis`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      user_id: userId,
      request_id: crypto.randomUUID(),
      analysis_type: "trading_advisor_chat",
      confidence: 0,
      output: { mode, prompt: message.slice(0, 4000), answer: answer.slice(0, 12000) },
      model,
    }),
  });

  if (!response.ok) {
    console.warn("AI audit write failed", response.status, (await response.text()).slice(0, 300));
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    console.error("OPENAI_API_KEY is not configured.");
    return json({ ok: false, error: "AI service is not configured on the server." }, 503);
  }

  try {
    const body = await req.json();
    const mode = body?.mode === "support" ? "support" : "advisor";
    const message = String(body?.message ?? "").trim().slice(0, 4000);
    if (!message) return json({ ok: false, error: "Message is required." }, 400);

    const history = cleanHistory(body?.history);
    const system = mode === "support"
      ? "You are the VELTRION support assistant. Help with app navigation, account connection, security hygiene, and troubleshooting. Never ask for or expose passwords, API keys, seed phrases, access tokens, or private credentials. Do not execute trades, transfers, deposits, or withdrawals."
      : "You are the VELTRION trading education advisor. Give risk-aware educational explanations and hypothetical strategy analysis. Do not promise returns, claim certainty, invent market data, or present advice as guaranteed financial instructions. The user may be using a sandbox trading terminal.";

    const model = Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    let upstream: Response;
    try {
      upstream = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: system }, ...history, { role: "user", content: message }],
          temperature: 0.2,
          max_tokens: 700,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const raw = await upstream.text();
    let data: any = null;
    try { data = JSON.parse(raw); } catch {}

    if (!upstream.ok) {
      console.error("AI upstream error", upstream.status, data?.error?.message ?? raw.slice(0, 500));
      return json({ ok: false, error: "The AI provider is temporarily unavailable. Please try again." }, 502);
    }

    const answer = String(data?.choices?.[0]?.message?.content ?? "").trim();
    if (!answer) {
      console.error("AI provider returned no answer.");
      return json({ ok: false, error: "The AI service returned an empty response." }, 502);
    }

    await writeAudit(req, model, mode, message, answer);
    return json({ ok: true, answer, mode, model });
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    console.error("ai-assistant error", error);
    return json({ ok: false, error: aborted ? "The AI provider timed out. Please retry." : "Unable to process the AI request right now." }, aborted ? 504 : 500);
  }
});