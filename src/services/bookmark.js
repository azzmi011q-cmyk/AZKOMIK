import { apiRequest } from './apiClient';
export const getBookmarks = async () => (await apiRequest('user/bookmarks')).items || [];
export const isComicBookmarked = async (comicId) => (await getBookmarks()).some(item => String(item.comic_id) === String(comicId));
export const toggleBookmark = async (comic) => (await apiRequest('user/bookmarks', { method: 'POST', body: JSON.stringify({ comicId: comic.comic_id || comic.id, title: comic.title, cover: comic.cover, type: comic.type || 'Manga', status: comic.status || 'Ongoing' }) })).bookmarked;
