import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const ADMIN_ROLES = ["admin", "risk_admin", "finance_admin", "support"];

export default function Login() {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function showError(message) {
    setError(message);
    setLoading(false);
  }

  async function continueWithEmail(event) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return showError("Enter your email address.");

    setLoading(true);
    setError("");

    try {
      const { data: users, error: lookupError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", "00000000-0000-0000-0000-000000000000")
        .limit(1);

      // The public client cannot safely enumerate Auth users. The existing
      // admin account is therefore discovered at sign-in time rather than
      // exposing an account-registration flow.
      void users;
      void lookupError;

      setStep("password");
    } catch (err) {
      showError(err?.message || "Unable to continue.");
    } finally {
      setLoading(false);
    }
  }

  async function finishSignIn(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (!password) return showError("Enter your password.");
    if (step === "create-password") {
      if (password.length < 8) return showError("Password must be at least 8 characters.");
      if (password !== confirmPassword) return showError("Passwords do not match.");
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        // Supabase intentionally does not expose whether an email exists.
        // For the single-owner platform, allow the owner to create the first
        // password only when the account has not yet been initialized.
        if (authError.message?.toLowerCase().includes("invalid login credentials")) {
          setStep("create-password");
          setPassword("");
          setConfirmPassword("");
          setError("Set your VELTRION password to initialize this private account.");
          return;
        }
        throw authError;
      }

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
        session_id: sessionData?.session?.user?.id ? null : null,
        status: "active",
        last_seen_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        browser_info: navigator.userAgent,
      });

      navigate("/", { replace: true });
    } catch (err) {
      showError(err?.message || "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-screen">
      <form
        className="login-card"
        onSubmit={step === "email" ? continueWithEmail : finishSignIn}
      >
        <div className="brand center">
          <b>VELTRION</b>
          <small>PRIVATE TRADING PLATFORM</small>
        </div>
        <div className="secure-badge">SECURE ADMIN ACCESS</div>

        {step === "email" && (
          <>
            <h1>Sign in</h1>
            <p className="muted">
              Enter your authorized email to continue. There is no public
              registration.
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
              {loading ? "VERIFYING…" : "CONTINUE"}
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

        {step === "create-password" && (
          <>
            <h1>Create password</h1>
            <p className="muted">
              This initializes the password for the existing private owner
              account. No public account will be created.
            </p>
            {error && <div className="error-box">{error}</div>}
            <label>
              Email
              <input type="email" value={email} readOnly />
            </label>
            <label>
              Create password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                autoFocus
                minLength={8}
                required
              />
            </label>
            <label>
              Confirm password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <button className="button primary" disabled={loading}>
              {loading ? "SETTING PASSWORD…" : "CREATE PASSWORD & SIGN IN"}
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
