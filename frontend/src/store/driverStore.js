import { create } from 'zustand';
import { driverAPI } from '../api/driver.api';

export const useDriverStore = create((set, get) => ({
    drivers: [],
    availableDrivers: [],
    selectedDriver: null,
    isLoading: false,
    error: null,
    total: 0,
    expiryAlerts: [],
    filters: { status: '', type: '', search: '' },

    fetchDrivers: async (params) => {
        set({ isLoading: true, error: null });
        try {
            const response = await driverAPI.getAll({ ...get().filters, ...params });
            set({
                drivers: response.data.drivers,
                total: response.data.total,
                isLoading: false
            });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchAvailableDrivers: async (type) => {
        set({ isLoading: true, error: null });
        try {
            const response = await driverAPI.getAvailable({ type });
            set({ availableDrivers: response.data, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchExpiryAlerts: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await driverAPI.getExpiryAlerts();
            set({ expiryAlerts: response.data, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchDriver: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await driverAPI.getById(id);
            set({ selectedDriver: response.data, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    createDriver: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const response = await driverAPI.create(data);
            set((state) => ({
                drivers: [response.data, ...state.drivers],
                isLoading: false
            }));
            return response.data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    updateDriver: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
            const response = await driverAPI.update(id, data);
            set((state) => ({
                drivers: state.drivers.map((d) => (d._id === id ? response.data : d)),
                selectedDriver: state.selectedDriver?._id === id ? response.data : state.selectedDriver,
                isLoading: false,
            }));
            return response.data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    updateDriverStatus: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
            const response = await driverAPI.updateStatus(id, data);
            set((state) => ({
                drivers: state.drivers.map((d) => (d._id === id ? response.data : d)),
                selectedDriver: state.selectedDriver?._id === id ? response.data : state.selectedDriver,
                isLoading: false,
            }));
            return response.data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    deleteDriver: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await driverAPI.delete(id);
            set((state) => ({
                drivers: state.drivers.filter((d) => d._id !== id),
                isLoading: false,
            }));
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    setFilters: (newFilters) => {
        set((state) => ({ filters: { ...state.filters, ...newFilters } }));
    },

    clearError: () => set({ error: null }),
}));
