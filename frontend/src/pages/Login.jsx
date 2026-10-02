import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const OWNER_EMAIL = "uasianubong@gmail.com";

function validatePassword(password) {
  if (password.length < 8) return "Password must be at least 8 characters.";
  return "";
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function recordSession(userId) {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    await supabase.from("user_sessions").insert({
      user_id: userId,
      session_id: accessToken ? sessionData.session.user.id : null,
      status: "active",
      last_seen_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
      browser_info: navigator.userAgent,
    });
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail) throw new Error("Enter your email address.");
      if (normalizedEmail !== OWNER_EMAIL) {
        throw new Error("This VELTRION login is restricted to the owner email.");
      }

      const passwordError = validatePassword(password);
      if (passwordError) throw new Error(passwordError);

      // Normal path: sign in to the existing Supabase Auth account.
      let { data, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      // First-use path: if the owner account has not been created yet,
      // create it using the same email/password form, then continue into
      // the dashboard. Supabase Auth stores the password securely; the
      // plaintext password is never written to the VELTRION database.
      if (authError) {
        const signup = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              email: normalizedEmail,
              owner: true,
            },
          },
        });

        if (signup.error) throw signup.error;
        if (!signup.data.user) {
          throw new Error("Account creation did not return a user.");
        }

        if (!signup.data.session) {
          throw new Error(
            "The VELTRION account was created, but Supabase is still requiring email confirmation. Disable Confirm email in Supabase Auth to allow direct email + password login without email verification."
          );
        }

        data = signup.data;
      }

      if (!data?.user) throw new Error("Login did not return an authenticated user.");

      await recordSession(data.user.id);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-screen">
      <form className="login-card" onSubmit={handleLogin}>
        <div className="brand center">
          <b>VELTRION</b>
          <small>PRIVATE TRADING PLATFORM</small>
        </div>

        <div className="secure-badge">SECURE ADMIN ACCESS</div>

        <h1>Login</h1>
        <p className="muted">
          Enter your VELTRION email and password to continue.
          Your first successful login creates your private Auth account.
        </p>

        {error && <div className="error-box">{error}</div>}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            minLength={8}
            required
          />
        </label>

        <button className="button primary" disabled={loading}>
          {loading ? "LOGGING IN…" : "LOGIN"}
        </button>

        <small className="security-note">
          Supabase Auth securely manages the password and account ID.
        </small>
      </form>
    </main>
  );
}
