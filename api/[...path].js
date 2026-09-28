const crypto = require('crypto');

const SESSION_COOKIE = 'azkom_session';
const SESSION_TTL = 60 * 60 * 24 * 30;

function env(name) {
  return process.env[name] || '';
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function parseCookies(req) {
  const raw = req.headers.cookie || '';
  return raw.split(';').reduce((out, part) => {
    const idx = part.indexOf('=');
    if (idx > -1) out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
    return out;
  }, {});
}

function getBearerToken(req) {
  const header = String(req.headers.authorization || '');
  if (!/^Bearer\s+/i.test(header)) return null;
  return header.replace(/^Bearer\s+/i, '').trim() || null;
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function signSession(userId, expiresAt) {
  const payload = base64url(JSON.stringify({ sub: userId, exp: expiresAt }));
  const sig = crypto.createHmac('sha256', env('AUTH_SECRET')).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifySession(token) {
  if (!token || !env('AUTH_SECRET')) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = crypto.createHmac('sha256', env('AUTH_SECRET')).update(payload).digest('base64url');
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.sub || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch { return null; }
}

function setSession(res, userId) {
  const token = signSession(userId, Math.floor(Date.now() / 1000) + SESSION_TTL);
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
}

function clearSession(res) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
}

function passwordHash(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}
function passwordVerify(password, stored) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(actual, 'hex'));
}
function cleanUsername(v) {
  return String(v || '').trim();
}
function rankForXp(xp) {
  if (xp >= 5000) return 'Raja Panel';
  if (xp >= 2500) return 'Legenda';
  if (xp >= 1200) return 'Veteran';
  if (xp >= 600) return 'Pembaca Senior';
  if (xp >= 250) return 'Pembaca Aktif';
  if (xp >= 100) return 'Pembaca';
  return 'Pendatang';
}
function calcXp({ comments = 0, votes = 0, bookmarks = 0, history = 0 }) {
  return comments * 10 + votes * 2 + bookmarks + history;
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return await new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; if (raw.length > 1024 * 1024) reject(new Error('Body terlalu besar')); });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('JSON tidak valid')); } });
    req.on('error', reject);
  });
}

function supabaseConfig() {
  const url = env('SUPABASE_URL').replace(/\/$/, '');
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY belum diatur.');
  return { url, key };
}

async function db(path, options = {}) {
  const { url, key } = supabaseConfig();
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: options.prefer || 'return=representation',
    ...(options.headers || {}),
  };
  const response = await fetch(`${url}/rest/v1/${path}`, { ...options, headers });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const message = data?.message || data?.hint || data?.details || 'Database request gagal';
    const error = new Error(message); error.status = response.status; throw error;
  }
  return data;
}

async function getUserById(id) {
  const rows = await db(`users?id=eq.${encodeURIComponent(id)}&select=id,username,email,avatar_url,bio,xp,rank,banned,created_at`, { method: 'GET' });
  return rows?.[0] || null;
}
async function requireUser(req) {
  // Prioritaskan Bearer token untuk Android/iOS, lalu fallback ke cookie untuk web.
  const token = getBearerToken(req) || parseCookies(req)[SESSION_COOKIE];
  const session = verifySession(token);
  if (!session) return null;
  const user = await getUserById(session.sub);
  if (!user || user.banned) return null;
  return user;
}

async function authRegister(req, res) {
  const body = await readBody(req);
  const username = cleanUsername(body.username);
  const password = String(body.password || '');
  const confirm = String(body.confirmPassword || '');
  const email = String(body.email || '').trim().toLowerCase() || null;
  if (!/^[A-Za-z0-9_]{3,24}$/.test(username)) return json(res, 400, { message: 'Username 3–24 karakter, hanya huruf, angka, dan _.' });
  if (password.length < 8) return json(res, 400, { message: 'Password minimal 8 karakter.' });
  if (password !== confirm) return json(res, 400, { message: 'Konfirmasi password tidak sama.' });
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return json(res, 400, { message: 'Format email tidak valid.' });
  const byUsername = await db(`users?username=ilike.${encodeURIComponent(username)}&select=id,username`, { method: 'GET' });
  if (byUsername?.length) return json(res, 409, { message: 'Username sudah digunakan.' });
  if (email) {
    const byEmail = await db(`users?email=eq.${encodeURIComponent(email)}&select=id,email`, { method: 'GET' });
    if (byEmail?.length) return json(res, 409, { message: 'Email sudah tertaut ke akun lain.' });
  }
  const rows = await db('users', { method: 'POST', body: JSON.stringify({ username, email, password_hash: passwordHash(password), xp: 0, rank: 'Pendatang', banned: false }) });
  const user = rows[0];
  const token = signSession(user.id, Math.floor(Date.now() / 1000) + SESSION_TTL);
  setSession(res, user.id);
  return json(res, 201, { user: await getUserById(user.id), token });
}

async function authLogin(req, res) {
  const body = await readBody(req);
  const username = cleanUsername(body.username);
  const password = String(body.password || '');
  const rows = await db(`users?username=ilike.${encodeURIComponent(username)}&select=id,username,email,password_hash,avatar_url,bio,xp,rank,banned,created_at`, { method: 'GET' });
  const user = rows?.[0];
  if (!user || !passwordVerify(password, user.password_hash)) return json(res, 401, { message: 'Username atau password salah.' });
  if (user.banned) return json(res, 403, { message: 'Akun ini telah dibanned.' });
  const token = signSession(user.id, Math.floor(Date.now() / 1000) + SESSION_TTL);
  setSession(res, user.id);
  delete user.password_hash;
  return json(res, { user, token });
}

async function authMe(req, res) {
  const user = await requireUser(req);
  return json(res, { user: user || null });
}

async function authLogout(req, res) {
  clearSession(res); return json(res, { ok: true });
}


async function profile(req, res, user) {
  if (!user) return json(res, 401, { message: 'Silakan login.' });
  const comments = await db(`comments?user_id=eq.${encodeURIComponent(user.id)}&select=id&limit=10000`, { method: 'GET' });
  const votes = await db(`votes?user_id=eq.${encodeURIComponent(user.id)}&select=id&limit=10000`, { method: 'GET' });
  const bookmarks = await db(`bookmarks?user_id=eq.${encodeURIComponent(user.id)}&select=id&limit=10000`, { method: 'GET' });
  const history = await db(`history?user_id=eq.${encodeURIComponent(user.id)}&select=id&limit=10000`, { method: 'GET' });
  const xp = calcXp({ comments: comments.length, votes: votes.length, bookmarks: bookmarks.length, history: history.length });
  const rank = rankForXp(xp);
  if (xp !== user.xp || rank !== user.rank) await db(`users?id=eq.${encodeURIComponent(user.id)}`, { method: 'PATCH', body: JSON.stringify({ xp, rank }), prefer: 'return=minimal' });
  return json(res, { user: { ...user, xp, rank }, stats: { comments: comments.length, votes: votes.length, bookmarks: bookmarks.length, history: history.length } });
}

async function community(req, res, user, action, params) {
  const comicId = String(params.comicId || '');
  if (!comicId) return json(res, 400, { message: 'comicId wajib.' });
  if (action === 'comments' && req.method === 'GET') {
    const rows = await db(`comments?comic_id=eq.${encodeURIComponent(comicId)}&select=id,user_id,username,text,created_at&order=created_at.desc`, { method: 'GET' });
    return json(res, { comments: rows || [] });
  }
  if (action === 'votes' && req.method === 'GET') {
    const rows = await db(`votes?comic_id=eq.${encodeURIComponent(comicId)}&select=vote_type,user_id`, { method: 'GET' });
    const totals = { up: 0, middle: 0, down: 0 };
    let myVote = null;
    for (const row of rows || []) { if (totals[row.vote_type] !== undefined) totals[row.vote_type]++; if (user && row.user_id === user.id) myVote = row.vote_type; }
    return json(res, { totals, myVote });
  }
  if (!user) return json(res, 401, { message: 'Silakan login terlebih dahulu.' });
  if (user.banned) return json(res, 403, { message: 'Akun dibanned.' });
  if (action === 'comment' && req.method === 'POST') {
    const body = await readBody(req);
    const text = String(body.text || '').trim().slice(0, 500);
    if (!text) return json(res, 400, { message: 'Komentar kosong.' });
    const blocked = /(rasis|politik|spam|porn|bokep)/i.test(text);
    if (blocked) return json(res, 400, { message: 'Komentar ditolak karena melanggar rules AZKOM.' });
    const rows = await db('comments', { method: 'POST', body: JSON.stringify({ comic_id: comicId, user_id: user.id, username: user.username, text }) });
    return json(res, 201, { comment: rows[0] });
  }
  if (action === 'vote' && req.method === 'POST') {
    const body = await readBody(req);
    const vote = String(body.vote || '');
    if (!['up', 'middle', 'down'].includes(vote)) return json(res, 400, { message: 'Vote tidak valid.' });
    const existing = await db(`votes?comic_id=eq.${encodeURIComponent(comicId)}&user_id=eq.${encodeURIComponent(user.id)}&select=id,vote_type&limit=1`, { method: 'GET' });
    if (existing?.[0]) {
      if (existing[0].vote_type === vote) await db(`votes?id=eq.${encodeURIComponent(existing[0].id)}`, { method: 'DELETE', prefer: 'return=minimal' });
      else await db(`votes?id=eq.${encodeURIComponent(existing[0].id)}`, { method: 'PATCH', body: JSON.stringify({ vote_type: vote }), prefer: 'return=minimal' });
    } else {
      await db('votes', { method: 'POST', body: JSON.stringify({ comic_id: comicId, user_id: user.id, vote_type: vote }) });
    }
    const rows = await db(`votes?comic_id=eq.${encodeURIComponent(comicId)}&select=vote_type,user_id`, { method: 'GET' });
    const totals = { up: 0, middle: 0, down: 0 };
    let myVote = null;
    for (const row of rows || []) { if (totals[row.vote_type] !== undefined) totals[row.vote_type]++; if (row.user_id === user.id) myVote = row.vote_type; }
    return json(res, { totals, myVote });
  }
}

async function userData(req, res, user, action) {
  if (!user) return json(res, 401, { message: 'Silakan login.' });
  if (action === 'bookmarks') {
    if (req.method === 'GET') {
      const rows = await db(`bookmarks?user_id=eq.${encodeURIComponent(user.id)}&select=id,comic_id,title,cover,type,status,created_at&order=created_at.desc`, { method: 'GET' });
      return json(res, { items: rows || [] });
    }
    const body = await readBody(req);
    const comicId = String(body.comicId || '');
    const existing = await db(`bookmarks?user_id=eq.${encodeURIComponent(user.id)}&comic_id=eq.${encodeURIComponent(comicId)}&select=id`, { method: 'GET' });
    if (existing?.[0]) await db(`bookmarks?id=eq.${encodeURIComponent(existing[0].id)}`, { method: 'DELETE', prefer: 'return=minimal' });
    else await db('bookmarks', { method: 'POST', body: JSON.stringify({ user_id: user.id, comic_id: comicId, title: body.title || '', cover: body.cover || '', type: body.type || 'Manga', status: body.status || 'Ongoing' }) });
    return json(res, { bookmarked: !existing?.[0] });
  }
  if (action === 'history') {
    if (req.method === 'DELETE') {
      await db(`history?user_id=eq.${encodeURIComponent(user.id)}`, { method: 'DELETE', prefer: 'return=minimal' });
      return json(res, { ok: true });
    }
    if (req.method === 'GET') {
      const rows = await db(`history?user_id=eq.${encodeURIComponent(user.id)}&select=id,comic_id,comic_title,cover,chapter_id,chapter_number,chapters,updated_at&order=updated_at.desc`, { method: 'GET' });
      return json(res, { items: rows || [] });
    }
    const body = await readBody(req);
    const existing = await db(`history?user_id=eq.${encodeURIComponent(user.id)}&comic_id=eq.${encodeURIComponent(String(body.comicId))}&select=id`, { method: 'GET' });
    if (existing?.[0]) await db(`history?id=eq.${encodeURIComponent(existing[0].id)}`, { method: 'PATCH', body: JSON.stringify({ comic_title: body.comicTitle || '', cover: body.cover || '', chapter_id: body.chapterId || null, chapter_number: body.chapterNumber || '', chapters: body.chapters || [], updated_at: new Date().toISOString() }), prefer: 'return=minimal' });
    else await db('history', { method: 'POST', body: JSON.stringify({ user_id: user.id, comic_id: String(body.comicId), comic_title: body.comicTitle || '', cover: body.cover || '', chapter_id: body.chapterId || null, chapter_number: body.chapterNumber || '', chapters: body.chapters || [] }) });
    return json(res, { ok: true });
  }
  return json(res, 404, { message: 'Endpoint user tidak ditemukan.' });
}

module.exports = async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Secret');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      return res.end();
    }
    const path = (req.query?.path || []).map(String);
    const user = await requireUser(req);
    if (path[0] === 'auth') {
      const action = path[1];
      if (action === 'register' && req.method === 'POST') return authRegister(req, res);
      if (action === 'login' && req.method === 'POST') return authLogin(req, res);
      if (action === 'me' && req.method === 'GET') return authMe(req, res);
      if (action === 'logout' && req.method === 'POST') return authLogout(req, res);
    }
    if (path[0] === 'profile' && req.method === 'GET') return profile(req, res, user);
    if (path[0] === 'community') return community(req, res, user, path[1], { comicId: path[2] });
    if (path[0] === 'user') return userData(req, res, user, path[1]);
    if (path[0] === 'admin' && req.method === 'POST') {
      if (!env('ADMIN_SECRET') || req.headers['x-admin-secret'] !== env('ADMIN_SECRET')) return json(res, 403, { message: 'Admin tidak terautentikasi.' });
      const body = await readBody(req);
      const username = cleanUsername(body.username);
      const banned = Boolean(body.banned);
      await db(`users?username=ilike.${encodeURIComponent(username)}`, { method: 'PATCH', body: JSON.stringify({ banned }), prefer: 'return=minimal' });
      return json(res, { ok: true, banned });
    }
    return json(res, 404, { message: 'API AZKOM tidak ditemukan.' });
  } catch (error) {
    console.error(error);
    return json(res, error.status || 500, { message: error.message || 'Terjadi kesalahan server.' });
  }
};
