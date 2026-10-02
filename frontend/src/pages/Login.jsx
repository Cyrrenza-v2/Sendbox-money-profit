import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const ADMIN_ROLES = ["admin", "risk_admin", "finance_admin", "support"];

export default function Login() {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function continueWithEmail(event) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Enter your email address.");
      return;
    }
    setEmail(normalizedEmail);
    setError("");
    setStep("password");
  }

  async function signIn(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) throw authError;

      const { data: roles, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);

      if (roleError) throw roleError;

      const admin = (roles || []).find((r) =>
        ADMIN_ROLES.includes(String(r.role).toLowerCase())
      );

      if (!admin) {
        await supabase.auth.signOut();
        throw new Error("Access denied: unauthorized identity.");
      }

      const { data: sessionData } = await supabase.auth.getSession();
      await supabase.from("user_sessions").insert({
        user_id: data.user.id,
        session_id: sessionData?.session?.access_token ? data.session?.user?.id ?? null : null,
        status: "active",
        last_seen_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        browser_info: navigator.userAgent,
      });

      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.message || "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  async function sendPasswordSetup() {
    setLoading(true);
    setError("");

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: window.location.origin + "/login" }
      );
      if (resetError) throw resetError;
      setError("Password setup email sent. Open the link in your email, then create your password.");
    } catch (err) {
      setError(err?.message || "Unable to send password setup email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-screen">
      <form className="login-card" onSubmit={step === "email" ? continueWithEmail : signIn}>
        <div className="brand center">
          <b>VELTRION</b>
          <small>PRIVATE TRADING PLATFORM</small>
        </div>
        <div className="secure-badge">SECURE ADMIN ACCESS</div>

        {step === "email" && (
          <>
            <h1>Sign in</h1>
            <p className="muted">
              Enter your authorized email to continue. There is no public registration.
            </p>
            {error && <div className="error-box">{error}</div>}
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </label>
            <button className="button primary" disabled={loading}>
              CONTINUE
            </button>
          </>
        )}

        {step === "password" && (
          <>
            <h1>Enter password</h1>
            <p className="muted">Sign in to your private VELTRION account.</p>
            {error && <div className="error-box">{error}</div>}
            <label>
              Email
              <input type="email" value={email} readOnly />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                autoFocus
                required
              />
            </label>
            <button className="button primary" disabled={loading}>
              {loading ? "VERIFYING…" : "SIGN IN"}
            </button>
            <button type="button" className="button secondary" onClick={sendPasswordSetup} disabled={loading}>
              CREATE / RESET PASSWORD
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setStep("email");
                setPassword("");
                setError("");
              }}
            >
              CHANGE EMAIL
            </button>
          </>
        )}

        <small className="security-note">
          Supabase Auth + database role authorization
        </small>
      </form>
    </main>
  );
}
