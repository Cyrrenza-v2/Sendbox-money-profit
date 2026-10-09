const ADMIN_ROLES = new Set(["admin", "risk_admin", "finance_admin", "support"]);
function authError(message, statusCode) { const error = new Error(message); error.statusCode = statusCode; return error; }
function sessionIdFromToken(token) {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const payload = JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
    return typeof payload.session_id === "string" && payload.session_id ? payload.session_id : null;
  } catch { return null; }
}
/** Server-side verifier for VELTRION's existing Supabase auth/session/role model. */
export class AuthService {
  constructor({ supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY, fetchImpl = globalThis.fetch } = {}) {
    this.supabaseUrl = String(supabaseUrl || "").replace(/\/$/, "");
    this.anonKey = anonKey; this.serviceRoleKey = serviceRoleKey; this.fetchImpl = fetchImpl;
  }
  async request(path, { key, token, method = "GET" } = {}) {
    if (!this.supabaseUrl || !key) throw new Error("AUTH_NOT_CONFIGURED");
    const headers = { apikey: key, Accept: "application/json" };
    headers.Authorization = token ? "Bearer " + token : "Bearer " + key;
    const response = await this.fetchImpl(this.supabaseUrl + path, { method, headers });
    let data = null; try { data = await response.json(); } catch { /* empty response */ }
    return { response, data };
  }
  async authenticateToken(token) {
    if (typeof token !== "string" || !token.trim()) throw authError("AUTH_REQUIRED", 401);
    if (!this.anonKey) throw new Error("AUTH_NOT_CONFIGURED");
    const { response, data } = await this.request("/auth/v1/user", { key: this.anonKey, token: token.trim() });
    if (!response.ok || !data?.id) throw authError("INVALID_SESSION", 401);
    return { user: data, token: token.trim() };
  }
  async verifyActiveSession(auth) {
    if (!this.serviceRoleKey) throw new Error("SESSION_VALIDATION_NOT_CONFIGURED");
    const sessionId = sessionIdFromToken(auth.token);
    if (!sessionId) throw authError("SESSION_ID_MISSING", 401);
    const query = new URLSearchParams({ select: "id,status,revoked_at,session_id", user_id: "eq." + auth.user.id, session_id: "eq." + sessionId, limit: "1" });
    const { response, data } = await this.request("/rest/v1/user_sessions?" + query, { key: this.serviceRoleKey });
    if (!response.ok) throw new Error("SESSION_LOOKUP_FAILED");
    const active = Array.isArray(data) && data.some(row => row.status === "active" && !row.revoked_at);
    if (!active) throw authError("SESSION_REVOKED", 401);
    return auth;
  }
  async verifyAdmin(auth) {
    if (!this.serviceRoleKey) throw new Error("ADMIN_VALIDATION_NOT_CONFIGURED");
    const query = new URLSearchParams({ select: "role", user_id: "eq." + auth.user.id, role: "in.(" + [...ADMIN_ROLES].join(",") + ")", limit: "1" });
    const { response, data } = await this.request("/rest/v1/user_roles?" + query, { key: this.serviceRoleKey });
    if (!response.ok) throw new Error("ADMIN_LOOKUP_FAILED");
    if (!Array.isArray(data) || data.length === 0) throw authError("ADMIN_REQUIRED", 403);
    return auth;
  }
}
