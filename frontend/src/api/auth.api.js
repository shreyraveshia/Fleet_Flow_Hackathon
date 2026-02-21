import api from './axios.config';

export const authAPI = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
    changePassword: (data) => api.put('/auth/change-password', data),
    updateProfile: (data) => api.put('/auth/profile', data),
};
