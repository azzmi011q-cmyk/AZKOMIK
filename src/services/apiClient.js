const TOKEN_KEY = 'azkom_session_token';

function token() { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } }

export async function apiRequest(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const t = token();
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`/api/${path}`, { ...options, credentials: 'include', headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Permintaan gagal (${res.status}).`);
  return data;
}
