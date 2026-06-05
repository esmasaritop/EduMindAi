import api from './axios';

export const getQuestions = () => api.get('/questions');
export const upsertQuestionStat = (topicId, data) => api.post(`/questions/topics/${topicId}`, data);
