import { apiRequest } from './apiClient';
export const saveHistory = async (item) => apiRequest('user/history', { method: 'POST', body: JSON.stringify(item) });
export const getHistory = async () => {
  const rows = (await apiRequest('user/history')).items || [];
  return rows.map(item => ({ comicId: item.comic_id, comicTitle: item.comic_title, cover: item.cover, chapterId: item.chapter_id, chapterNumber: item.chapter_number, chapters: item.chapters || [], updatedAt: item.updated_at }));
};
export const clearHistory = async () => apiRequest('user/history', { method: 'DELETE' });
