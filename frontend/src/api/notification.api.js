import api from './axios.config';

export const notificationAPI = {
    getAll: () => api.get('/notifications'),
    getUnreadCount: () => api.get('/notifications/unread-count'),
    markAsRead: (id) => api.patch(`/notifications/${id}/read`),
    markAllRead: () => api.patch('/notifications/read-all'),
    delete: (id) => api.delete(`/notifications/${id}`),
};
