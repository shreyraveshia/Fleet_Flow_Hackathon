import api from './axios.config';

export const maintenanceAPI = {
    getAll: (params) => api.get('/maintenance', { params }),
    getById: (id) => api.get(`/maintenance/${id}`),
    create: (data) => api.post('/maintenance', data),
    update: (id, data) => api.put(`/maintenance/${id}`, data),
    resolve: (id) => api.patch(`/maintenance/${id}/resolve`),
    delete: (id) => api.delete(`/maintenance/${id}`),
};
