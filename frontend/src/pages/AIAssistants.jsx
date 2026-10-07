import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";

const starterPrompts = {
  advisor: [
    "How should I think about risk before testing a strategy?",
    "Explain position sizing and drawdown in simple terms.",
    "Help me review a hypothetical trading plan.",
  ],
  support: [
    "How do I connect my Deriv account?",
    "What is the difference between sandbox and real mode?",
    "How can I troubleshoot a connection issue?",
  ],
};

export default function AIAssistants() {
  const [mode, setMode] = useState("advisor");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState({ advisor: [], support: [] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const activeMessages = messages[mode];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [activeMessages, busy]);

  const send = async (text = draft) => {
    const message = String(text || "").trim();
    if (!message || busy) return;
    setError("");
    setDraft("");
    const current = messages[mode];
    const next = [...current, { role: "user", content: message }];
    setMessages(prev => ({ ...prev, [mode]: next }));
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Your session has expired. Please sign in again.");
      const { data, error: invokeError } = await supabase.functions.invoke("ai-assistant", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { mode, message, history: current.slice(-8).map(({ role, content }) => ({ role, content })) },
      });
      if (invokeError) {
        const detail = data?.error || invokeError.message;
        throw new Error(detail || "Unable to reach the AI service.");
      }
      if (!data?.ok || !data?.answer) throw new Error(data?.error || "The AI service did not return an answer.");
      setMessages(prev => ({ ...prev, [mode]: [...prev[mode], { role: "assistant", content: data.answer }] }));
    } catch (e) {
      setError(e.message || "Unable to send message. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const changeMode = next => { setMode(next); setError(""); };
  return <div className="page ai-page">
    <div className="page-head"><div><span className="eyebrow">INTELLIGENCE / ASSISTANTS</span><h1>AI Assistants</h1><p>Private, authenticated help for trading education and VELTRION app support.</p></div><span className="live-stamp">ADVISORY ONLY</span></div>
    <div className="ai-tabs" role="tablist" aria-label="AI assistant type">
      <button className={mode === "advisor" ? "active" : ""} onClick={() => changeMode("advisor")} role="tab" aria-selected={mode === "advisor"}><b>◈ AI Trading Advisor</b><small>Risk-aware educational analysis</small></button>
      <button className={mode === "support" ? "active" : ""} onClick={() => changeMode("support")} role="tab" aria-selected={mode === "support"}><b>✦ AI Support Assistant</b><small>Navigation and troubleshooting</small></button>
    </div>
    <section className="panel ai-chat-panel">
      <div className="panel-title"><h2>{mode === "advisor" ? "Trading Advisor" : "Support Assistant"}</h2><span>AUTHENTICATED SESSION</span></div>
      <div className="ai-notice">{mode === "advisor" ? "Educational guidance only. Responses are not live market data, financial guarantees, or trade instructions." : "General app guidance only. Never share passwords, API keys, seed phrases, or account tokens."}</div>
      <div className="ai-messages" aria-live="polite">
        {activeMessages.length === 0 && <div className="ai-welcome"><div className="ai-mark">{mode === "advisor" ? "◈" : "✦"}</div><h3>{mode === "advisor" ? "Think through risk before taking action." : "How can I help with VELTRION?"}</h3><p>{mode === "advisor" ? "Ask about trading concepts, hypothetical plans, risk controls, or sandbox testing." : "Ask about app navigation, account connections, security, or troubleshooting."}</p><div className="ai-starters">{starterPrompts[mode].map(item => <button key={item} onClick={() => send(item)} disabled={busy}>{item} <span>↗</span></button>)}</div></div>}
        {activeMessages.map((item, i) => <div className={"ai-message " + item.role} key={i}><span className="ai-role">{item.role === "user" ? "YOU" : mode === "advisor" ? "TRADING ADVISOR" : "SUPPORT ASSISTANT"}</span><p>{item.content}</p></div>)}
        {busy && <div className="ai-message assistant"><span className="ai-role">VELTRION AI</span><p className="ai-typing">Preparing a response…</p></div>}
        <div ref={bottomRef} />
      </div>
      {error && <div className="ai-error" role="alert">{error}</div>}
      <form className="ai-composer" onSubmit={e => { e.preventDefault(); send(); }}>
        <label className="sr-only" htmlFor="ai-message">Your message</label>
        <textarea id="ai-message" rows="2" maxLength={4000} placeholder={mode === "advisor" ? "Ask a question about risk, strategy concepts, or sandbox testing…" : "Describe your VELTRION question or issue…"} value={draft} onChange={e => setDraft(e.target.value)} disabled={busy} />
        <button className="primary" type="submit" disabled={busy || !draft.trim()}>{busy ? "THINKING…" : "SEND MESSAGE ↗"}</button>
      </form>
      <div className="ai-footnote">AI responses may be inaccurate. Verify important information independently. No trades, transfers, deposits, or withdrawals are executed by these assistants.</div>
    </section>
  </div>;
}
