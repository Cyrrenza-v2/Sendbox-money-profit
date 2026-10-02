const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function supabaseUserFromToken(token) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('AUTH_NOT_CONFIGURED');
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers:{ Authorization:`Bearer ${token}`, apikey:SUPABASE_ANON_KEY }
  });
  if (!response.ok) return null;
  return response.json();
}

export async function requireAuth(req) {
  const value = req.headers.authorization || '';
  if (!value.startsWith('Bearer ')) {
    const error = new Error('AUTH_REQUIRED'); error.statusCode=401; throw error;
  }
  const token=value.slice(7).trim();
  if (!token) { const error=new Error('AUTH_REQUIRED'); error.statusCode=401; throw error; }
  const user=await supabaseUserFromToken(token);
  if (!user?.id) { const error=new Error('INVALID_SESSION'); error.statusCode=401; throw error; }
  return { user, token };
}

export async function requireActiveSession(req) {
  const auth=await requireAuth(req);
  if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SESSION_VALIDATION_NOT_CONFIGURED');
  const url=new URL(`${SUPABASE_URL}/rest/v1/user_sessions`);
  url.searchParams.set('select','id,status,revoked_at,session_id');
  url.searchParams.set('user_id',`eq.${auth.user.id}`);
  url.searchParams.set('session_id',`eq.${auth.user.id}`);
  url.searchParams.set('limit','1');
  const response=await fetch(url,{headers:{apikey:SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${SUPABASE_SERVICE_ROLE_KEY}`}});
  if (!response.ok) throw new Error('SESSION_LOOKUP_FAILED');
  const rows=await response.json();
  const active=rows.find(row=>row.status==='active' && !row.revoked_at);
  if (!active) { const error=new Error('SESSION_REVOKED'); error.statusCode=401; throw error; }
  return auth;
}
