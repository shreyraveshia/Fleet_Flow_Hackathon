import api from './axios.config';

export const exportAPI = {
    vehiclesCSV: () => api.get('/export/vehicles-csv', { responseType: 'blob' }),
    tripsCSV: () => api.get('/export/trips-csv', { responseType: 'blob' }),
    expensesCSV: () => api.get('/export/expenses-csv', { responseType: 'blob' }),
    analyticsPDF: () => api.get('/export/analytics-pdf', { responseType: 'blob' }),
    monthlyReportPDF: () => api.get('/export/monthly-report-pdf', { responseType: 'blob' }),
};
