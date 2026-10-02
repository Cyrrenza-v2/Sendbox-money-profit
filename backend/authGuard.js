import { AuthService } from "./services/authService.js";
const authService = new AuthService();
export async function requireAuth(req) {
  const value = req.headers.authorization || "";
  if (!value.startsWith("Bearer ")) { const error = new Error("AUTH_REQUIRED"); error.statusCode = 401; throw error; }
  return authService.authenticateToken(value.slice(7).trim());
}
export async function requireActiveSession(req) {
  const auth = await requireAuth(req);
  return authService.verifyActiveSession(auth);
}
export async function requireAdmin(req) {
  const auth = await requireActiveSession(req);
  return authService.verifyAdmin(auth);
}
