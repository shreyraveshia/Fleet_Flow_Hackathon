import api from './axios.config';

export const tripAPI = {
    getAll: (params) => api.get('/trips', { params }),
    getById: (id) => api.get(`/trips/${id}`),
    getTimeline: (id) => api.get(`/trips/${id}/timeline`),
    create: (data) => api.post('/trips', data),
    advanceStatus: (id, data) => api.patch(`/trips/${id}/status`, data),
};
