import api from './axios.config';

export const vehicleAPI = {
    getAll: (params) => api.get('/vehicles', { params }),
    getAvailable: (params) => api.get('/vehicles/available', { params }),
    getById: (id) => api.get(`/vehicles/${id}`),
    create: (data) => api.post('/vehicles', data),
    update: (id, data) => api.put(`/vehicles/${id}`, data),
    delete: (id) => api.delete(`/vehicles/${id}`),
    updateStatus: (id, status) => api.patch(`/vehicles/${id}/status`, { status }),
};
