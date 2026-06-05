import api from './axios';

export const getTopics = (subjectId) => api.get(`/subjects/${subjectId}/topics`);
export const createTopic = (subjectId, data) => api.post(`/subjects/${subjectId}/topics`, data);
export const updateTopic = (id, data) => api.put(`/topics/${id}`, data);
export const addTopicTime = (id, minutes) => api.patch(`/topics/${id}/add-time`, { minutes });
export const deleteTopic = (id) => api.delete(`/topics/${id}`);
