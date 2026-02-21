import api from './axios.config';

export const driverAPI = {
    getAll: (params) => api.get('/drivers', { params }),
    getAvailable: (params) => api.get('/drivers/available', { params }),
    getExpiryAlerts: () => api.get('/drivers/expiry-alerts'),
    getById: (id) => api.get(`/drivers/${id}`),
    create: (data) => api.post('/drivers', data),
    update: (id, data) => api.put(`/drivers/${id}`, data),
    updateStatus: (id, data) => api.patch(`/drivers/${id}/status`, data),
    delete: (id) => api.delete(`/drivers/${id}`),
};
