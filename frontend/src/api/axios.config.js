import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    timeout: 15000,
});

// Request interceptor: add Authorization: Bearer {token}
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('fleetflow_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('fleetflow_token');
            localStorage.removeItem('fleetflow_user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        let message = 'Something went wrong';

        if (error.response) {
            // Server responded with an error
            message = error.response.data?.message || error.response.statusText || 'Server Error';
        } else if (error.request) {
            // Request made but no response received
            message = 'No response from server. Please check your connection.';
        } else {
            // Something else happened
            message = error.message;
        }

        const errorData = {
            message,
            errors: error.response?.data?.errors || null,
            statusCode: error.response?.status || 500,
        };

        return Promise.reject(errorData);
    }
);

export default api;
