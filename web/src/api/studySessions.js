import api from './axios';

export const getSessions = (page = 1) => api.get(`/study-sessions?page=${page}`);
export const createSession = (data) => api.post('/study-sessions', data);
export const updateSession = (id, data) => api.put(`/study-sessions/${id}`, data);
export const deleteSession = (id) => api.delete(`/study-sessions/${id}`);
export const restoreSession = (id) => api.patch(`/study-sessions/${id}/restore`);
