const API_BASE = '';
const TOKEN_KEY = 'azkom_session_token';

function apiUrl(path) { return `${API_BASE}/api/${path}`; }
function getToken() { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } }
function saveToken(token) { try { if (token) localStorage.setItem(TOKEN_KEY, token); } catch {} }
function clearToken() { try { localStorage.removeItem(TOKEN_KEY); } catch {} }

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(apiUrl(path), { ...options, credentials: 'include', headers });
  } catch (error) {
    throw new Error(`Tidak dapat terhubung ke server AZKOM. (${error.message})`);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) clearToken();
    throw new Error(data.message || `Permintaan gagal (${response.status}).`);
  }
  return data;
}

export const getMe = () => request('auth/me');
export const login = async (username, password) => {
  const data = await request('auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
  saveToken(data.token);
  return data;
};
export const register = async (username, password, confirmPassword, email) => {
  const data = await request('auth/register', { method: 'POST', body: JSON.stringify({ username, password, confirmPassword, email }) });
  saveToken(data.token);
  return data;
};
export const logout = async () => {
  try { return await request('auth/logout', { method: 'POST', body: '{}' }); }
  finally { clearToken(); }
};
export const getProfile = () => request('profile');
