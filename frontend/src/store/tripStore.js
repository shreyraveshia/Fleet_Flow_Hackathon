import { create } from 'zustand';
import { tripAPI } from '../api/trip.api';

export const useTripStore = create((set, get) => ({
    trips: [],
    selectedTrip: null,
    tripTimeline: [],
    isLoading: false,
    error: null,
    total: 0,
    activeFilter: 'All',

    fetchTrips: async (params) => {
        set({ isLoading: true, error: null });
        try {
            const response = await tripAPI.getAll({
                status: get().activeFilter === 'All' ? '' : get().activeFilter,
                ...params
            });
            set({
                trips: response.data.trips,
                total: response.data.total,
                isLoading: false
            });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchTrip: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const [tripRes, timelineRes] = await Promise.all([
                tripAPI.getById(id),
                tripAPI.getTimeline(id)
            ]);
            set({
                selectedTrip: tripRes.data,
                // API returns { data: { timeline: [...], tripId, ... } }
                tripTimeline: timelineRes.data?.timeline || timelineRes.data || [],
                isLoading: false
            });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    createTrip: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const response = await tripAPI.create(data);
            set({ isLoading: false });
            get().fetchTrips();
            return response.data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    advanceStatus: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
            const response = await tripAPI.advanceStatus(id, data);
            set((state) => ({
                trips: state.trips.map((t) => (t._id === id ? response.data : t)),
                selectedTrip: state.selectedTrip?._id === id ? response.data : state.selectedTrip,
                isLoading: false,
            }));
            // Refresh timeline if it's the selected trip
            if (get().selectedTrip?._id === id) {
                const timelineRes = await tripAPI.getTimeline(id);
                set({ tripTimeline: timelineRes.data?.timeline || timelineRes.data || [] });
            }
            return response.data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    setFilter: (status) => {
        set({ activeFilter: status });
        get().fetchTrips();
    },

    clearError: () => set({ error: null }),
}));
