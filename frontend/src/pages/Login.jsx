import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const ADMIN_ROLES = ["admin", "risk_admin", "finance_admin", "support"];
const OWNER_EMAIL = "uasianubong@gmail.com";

function validatePassword(password) {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must contain at least one letter and one number.";
  }
  return "";
}

export default function Login() {
  const [mode, setMode] = useState("signin");
  const [step, setStep] = useState("email");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function switchMode(nextMode) {
    setMode(nextMode);
    setStep("email");
    setPassword("");
    setConfirmPassword("");
    setError("");
  }

  function continueSignIn(event) {
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

  function continueRegistration(event) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!firstName.trim() || !surname.trim()) {
      setError("Enter your first name and surname.");
      return;
    }
    if (!normalizedEmail) {
      setError("Enter your email address.");
      return;
    }
    if (normalizedEmail !== OWNER_EMAIL) {
      setError("This VELTRION account is restricted to the owner email.");
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

      await recordSession(data.user.id);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.message || "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

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

  async function createAccount(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const passwordError = validatePassword(password);
      if (passwordError) throw new Error(passwordError);
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== OWNER_EMAIL) {
        throw new Error("This VELTRION account is restricted to the owner email.");
      }

      const { data, error: signupError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            surname: surname.trim(),
            full_name: `${firstName.trim()} ${surname.trim()}`,
          },
        },
      });

      if (signupError) throw signupError;
      if (!data.user) throw new Error("Account creation did not return a user.");

      if (!data.session) {
        throw new Error(
          "Supabase email confirmation is still enabled. Disable email confirmations in Supabase Auth so this owner account can sign in immediately without email."
        );
      }

      const { error: claimError } = await supabase.rpc("claim_veltrion_owner");
      if (claimError) throw claimError;

      await recordSession(data.user.id);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.message || "Account creation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-screen">
      <form
        className="login-card"
        onSubmit={
          mode === "signin"
            ? step === "email"
              ? continueSignIn
              : signIn
            : step === "email"
              ? continueRegistration
              : createAccount
        }
      >
        <div className="brand center">
          <b>VELTRION</b>
          <small>PRIVATE TRADING PLATFORM</small>
        </div>
        <div className="secure-badge">SECURE ADMIN ACCESS</div>

        {step === "email" && (
          <>
            <h1>{mode === "signin" ? "Sign in" : "Create account"}</h1>
            <p className="muted">
              {mode === "signin"
                ? "Enter your authorized email to continue."
                : "Set up the private VELTRION owner account. No email verification is used."}
            </p>

            <div className="login-mode-toggle">
              <button
                type="button"
                className={`button ${mode === "signin" ? "primary" : "secondary"}`}
                onClick={() => switchMode("signin")}
              >
                SIGN IN
              </button>
              <button
                type="button"
                className={`button ${mode === "register" ? "primary" : "secondary"}`}
                onClick={() => switchMode("register")}
              >
                CREATE ACCOUNT
              </button>
            </div>

            {mode === "register" && (
              <>
                <label>
                  First name
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                    autoFocus
                    required
                  />
                </label>
                <label>
                  Surname
                  <input
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    autoComplete="family-name"
                    required
                  />
                </label>
              </>
            )}

            {error && <div className="error-box">{error}</div>}

            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus={mode === "signin"}
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
            <h1>{mode === "signin" ? "Enter password" : "Create password"}</h1>
            <p className="muted">
              {mode === "signin"
                ? "Enter your VELTRION password to open the dashboard."
                : "Use at least 8 characters with at least one letter and one number."}
            </p>

            {error && <div className="error-box">{error}</div>}

            <label>
              Email
              <input type="email" value={email} readOnly />
            </label>

            {mode === "register" && (
              <label>
                Account name
                <input
                  value={`${firstName} ${surname}`}
                  readOnly
                />
              </label>
            )}

            <label>
              {mode === "signin" ? "Password" : "Create password"}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                autoFocus
                minLength={8}
                required
              />
            </label>

            {mode === "register" && (
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
            )}

            <button className="button primary" disabled={loading}>
              {loading
                ? mode === "signin"
                  ? "VERIFYING…"
                  : "CREATING ACCOUNT…"
                : mode === "signin"
                  ? "SIGN IN"
                  : "CREATE ACCOUNT"}
            </button>

            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setStep("email");
                setPassword("");
                setConfirmPassword("");
                setError("");
              }}
              disabled={loading}
            >
              BACK
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
