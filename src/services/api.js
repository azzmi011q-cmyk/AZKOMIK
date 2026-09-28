const BASE_URL = 'https://kaeltoon-api.kaeldev.my.id';
const cache = new Map();
const TTL = 5 * 60 * 1000;

export const isCached = (endpoint) => {
  const cached = cache.get(endpoint);
  return Boolean(cached && Date.now() - cached.timestamp < TTL);
};

async function request(endpoint) {
  const cached = cache.get(endpoint);
  if (cached && Date.now() - cached.timestamp < TTL) {
    return cached.full || cached.data;
  }
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const json = await response.json();
    if (json.status === 'success') {
      const payload = json.pagination ? { data: json.data, pagination: json.pagination } : json.data;
      cache.set(endpoint, { data: json.data, full: payload, timestamp: Date.now() });
      return payload;
    }
    throw new Error(json.message || 'API Request Failed');
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

export const getHome = () => request('/home');
export const getSliders = () => request('/slider');
export const getPopular = (page = 1) => request(`/popular?page=${page}`);
export const getLatest = (page = 1) => request(`/latest?page=${page}`);
export const getRecommended = (page = 1) => request(`/recommended?page=${page}`);
export const getMangaDetail = (id) => request(`/manga/${id}`);
export const getMangaChapters = (mangaId, page = 1) => request(`/chapters/${mangaId}?page=${page}`);
export const searchManga = (query, page = 1) => request(`/search?q=${encodeURIComponent(query)}&page=${page}`);
export const getChapterPages = async (chapterId) => {
  const result = await request(`/read/${chapterId}`);
  if (typeof result === 'string' && result.startsWith('http')) {
    try {
      const res = await fetch(result);
      const json = await res.json();
      if (json && json.data) {
        if (Array.isArray(json.data.images)) return json.data.images;
        if (Array.isArray(json.data)) return json.data;
      }
      if (Array.isArray(json)) return json;
      if (Array.isArray(json.images)) return json.images;
    } catch (e) {
      console.error('Error fetching external images:', e);
    }
  }
  return Array.isArray(result) ? result : [];
};
