import api from './axios.config';

export const expenseAPI = {
    getAll: (params) => api.get('/expenses', { params }),
    getById: (id) => api.get(`/expenses/${id}`),
    getByVehicle: (vehicleId) => api.get(`/expenses/vehicle/${vehicleId}`),
    getMonthlySummary: () => api.get('/expenses/monthly-summary'),
    create: (data) => api.post('/expenses', data),
    update: (id, data) => api.put(`/expenses/${id}`, data),
    delete: (id) => api.delete(`/expenses/${id}`),
};
