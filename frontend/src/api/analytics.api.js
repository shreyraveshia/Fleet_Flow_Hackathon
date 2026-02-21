import api from './axios.config';

export const analyticsAPI = {
    getDashboard: () => api.get('/analytics/dashboard'),
    getFuelEfficiency: () => api.get('/analytics/fuel-efficiency'),
    getVehicleROI: () => api.get('/analytics/vehicle-roi'),
    getMonthlySummary: () => api.get('/analytics/monthly-summary'),
    getDriverStats: () => api.get('/analytics/driver-stats'),
    getFleetOverview: () => api.get('/analytics/fleet-overview'),
};
