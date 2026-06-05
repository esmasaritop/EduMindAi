import api from './axios';

export const getNotifications = (type = 'all', perPage = 50) =>
  api.get('/notifications', {
    params: {
      per_page: perPage,
      ...(type !== 'all' ? { type } : {}),
    },
  });

export const getNotificationSummary = () => api.get('/notifications/summary');

export const markAllRead = () => api.patch('/notifications/mark-all-read');

export const markRead = (id) => api.patch(`/notifications/${id}/read`);
