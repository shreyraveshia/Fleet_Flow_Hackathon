import api from './axios.config';

export const auditAPI = {
    getAll: (params) => api.get('/audit', { params }),
};
