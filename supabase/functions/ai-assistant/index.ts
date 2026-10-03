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
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, ...history, { role: "user", content: message }],
        temperature: 0.2,
        max_tokens: 700,
      }),
    });

    const raw = await upstream.text();
    let data: any = null;
    try { data = JSON.parse(raw); } catch { /* preserve a safe generic error */ }

    if (!upstream.ok) {
      console.error("AI upstream error", upstream.status, data?.error?.message ?? raw.slice(0, 500));
      return json({ ok: false, error: "The AI provider is temporarily unavailable. Please try again." }, 502);
    }

    const answer = String(data?.choices?.[0]?.message?.content ?? "").trim();
    if (!answer) {
      console.error("AI provider returned no answer.");
      return json({ ok: false, error: "The AI service returned an empty response." }, 502);
    }

    return json({ ok: true, answer, mode, model });
  } catch (error) {
    console.error("ai-assistant error", error);
    return json({ ok: false, error: "Unable to process the AI request right now." }, 500);
  }
});
