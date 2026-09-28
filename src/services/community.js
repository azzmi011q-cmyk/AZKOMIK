import { apiRequest } from './apiClient';
export const getComments = async (comicId) => (await apiRequest(`community/comments/${encodeURIComponent(comicId)}`)).comments || [];
export const addComment = async ({ comicId, text }) => (await apiRequest(`community/comment/${encodeURIComponent(comicId)}`, { method: 'POST', body: JSON.stringify({ text }) })).comment;
export const getComicVotes = async (comicId) => apiRequest(`community/votes/${encodeURIComponent(comicId)}`);
export const voteComic = async (comicId, vote) => apiRequest(`community/vote/${encodeURIComponent(comicId)}`, { method: 'POST', body: JSON.stringify({ vote }) });
