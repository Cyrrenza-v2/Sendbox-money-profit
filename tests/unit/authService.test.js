import test from "node:test";
import assert from "node:assert/strict";
import { AuthService } from "../../backend/services/authService.js";
function jwt(payload) {
  const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
  return encode({ alg: "none", typ: "JWT" }) + "." + encode(payload) + ".signature";
}
function response(status, data) { return { ok: status >= 200 && status < 300, status, json: async () => data }; }

test("authenticateToken verifies bearer tokens with Supabase Auth", async () => {
  const calls = [];
  const service = new AuthService({ supabaseUrl: "https://example.supabase.co", anonKey: "anon", serviceRoleKey: "service",
    fetchImpl: async (url, options) => { calls.push({ url, options }); return response(200, { id: "user-1", email: "admin@example.test" }); } });
  const auth = await service.authenticateToken("valid-token");
  assert.equal(auth.user.id, "user-1");
  assert.equal(calls[0].url, "https://example.supabase.co/auth/v1/user");
  assert.equal(calls[0].options.headers.Authorization, "Bearer valid-token");
});
test("authenticateToken rejects invalid or expired tokens", async () => {
  const service = new AuthService({ supabaseUrl: "https://example.supabase.co", anonKey: "anon", fetchImpl: async () => response(401, {}) });
  await assert.rejects(service.authenticateToken("expired"), error => error.statusCode === 401 && error.message === "INVALID_SESSION");
});
test("verifyActiveSession rejects missing session identifiers", async () => {
  const service = new AuthService({ supabaseUrl: "https://example.supabase.co", anonKey: "anon", serviceRoleKey: "service" });
  await assert.rejects(service.verifyActiveSession({ user: { id: "user-1" }, token: "not-a-jwt" }), error => error.statusCode === 401 && error.message === "SESSION_ID_MISSING");
});
test("verifyActiveSession rejects revoked sessions", async () => {
  const service = new AuthService({ supabaseUrl: "https://example.supabase.co", anonKey: "anon", serviceRoleKey: "service",
    fetchImpl: async () => response(200, [{ id: "row-1", status: "revoked", revoked_at: "2026-10-01T00:00:00Z", session_id: "session-1" }]) });
  await assert.rejects(service.verifyActiveSession({ user: { id: "user-1" }, token: jwt({ session_id: "session-1" }) }), error => error.statusCode === 401 && error.message === "SESSION_REVOKED");
});
test("verifyAdmin rejects users without an allowed admin role", async () => {
  const service = new AuthService({ supabaseUrl: "https://example.supabase.co", anonKey: "anon", serviceRoleKey: "service", fetchImpl: async () => response(200, []) });
  await assert.rejects(service.verifyAdmin({ user: { id: "user-1" }, token: "token" }), error => error.statusCode === 403 && error.message === "ADMIN_REQUIRED");
});
test("verifyAdmin allows a server-confirmed admin role record", async () => {
  const calls = [];
  const service = new AuthService({ supabaseUrl: "https://example.supabase.co", anonKey: "anon", serviceRoleKey: "service",
    fetchImpl: async (url, options) => { calls.push({ url, options }); return response(200, [{ role: "admin" }]); } });
  const auth = { user: { id: "user-1" }, token: "token" };
  assert.equal(await service.verifyAdmin(auth), auth);
  assert.match(calls[0].url, /user_roles\?/);
  assert.equal(calls[0].options.headers.Authorization, "Bearer service");
});
