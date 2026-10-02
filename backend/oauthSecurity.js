import crypto from "node:crypto";
export function createPkcePair(){const verifier=crypto.randomBytes(32).toString("base64url");const challenge=crypto.createHash("sha256").update(verifier).digest("base64url");return{verifier,challenge};}
export function createOAuthState(){return crypto.randomBytes(24).toString("base64url");}
export function validateOAuthCallback({expectedState,state,expectedVerifier,verifier}) {
  if(!expectedState||!state||expectedState.length!==state.length||!crypto.timingSafeEqual(Buffer.from(expectedState),Buffer.from(state))) throw new Error("OAUTH_STATE_MISMATCH");
  if(!expectedVerifier||expectedVerifier!==verifier) throw new Error("PKCE_VERIFIER_MISMATCH");
  return true;
}