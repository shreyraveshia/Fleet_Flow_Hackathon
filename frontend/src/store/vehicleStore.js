import { create } from 'zustand';
import { vehicleAPI } from '../api/vehicle.api';

export const useVehicleStore = create((set, get) => ({
    vehicles: [],
    availableVehicles: [],
    selectedVehicle: null,
    isLoading: false,
    error: null,
    total: 0,
    filters: { status: '', type: '', region: '', search: '' },

    fetchVehicles: async (params) => {
        set({ isLoading: true, error: null });
        try {
            const filters = { ...get().filters };
            // Normalize "All" values to empty strings for API
            Object.keys(filters).forEach(key => {
                if (filters[key] === 'All') filters[key] = '';
            });

            const response = await vehicleAPI.getAll({ ...filters, ...params });
            set({
                vehicles: response.data.vehicles,
                total: response.data.total,
                isLoading: false
            });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchAvailableVehicles: async (type) => {
        set({ isLoading: true, error: null });
        try {
            const response = await vehicleAPI.getAvailable({ type });
            set({ availableVehicles: response.data, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchVehicle: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await vehicleAPI.getById(id);
            set({ selectedVehicle: response.data, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    createVehicle: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const response = await vehicleAPI.create(data);
            set((state) => ({
                vehicles: [response.data, ...state.vehicles],
                isLoading: false
            }));
            return response.data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    updateVehicle: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
            const response = await vehicleAPI.update(id, data);
            set((state) => ({
                vehicles: state.vehicles.map((v) => (v._id === id ? response.data : v)),
                selectedVehicle: state.selectedVehicle?._id === id ? response.data : state.selectedVehicle,
                isLoading: false,
            }));
            return response.data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    deleteVehicle: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await vehicleAPI.delete(id);
            set((state) => ({
                vehicles: state.vehicles.filter((v) => v._id !== id),
                isLoading: false,
            }));
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    updateVehicleStatus: async (id, status) => {
        set({ isLoading: true, error: null });
        try {
            const response = await vehicleAPI.updateStatus(id, status);
            set((state) => ({
                vehicles: state.vehicles.map((v) => (v._id === id ? response.data : v)),
                selectedVehicle: state.selectedVehicle?._id === id ? response.data : state.selectedVehicle,
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
