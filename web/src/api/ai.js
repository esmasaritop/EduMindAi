import api from './axios';

export const getAiRecommendations = () => api.get('/ai/recommendations');

export const getAiStatus = () => api.get('/ai/recommendations/status');

export const generateAiRecommendations = () => api.post('/ai/recommendations/generate');
