import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authAPI } from '../api/auth.api';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await authAPI.login({ email, password });
                    const { user, token } = response.data;

                    localStorage.setItem('fleetflow_token', token);
                    localStorage.setItem('fleetflow_user', JSON.stringify(user));

                    set({
                        user,
                        token,
                        isAuthenticated: true,
                        isLoading: false
                    });
                    return user;
                } catch (error) {
                    set({
                        error: error.message || 'Login failed',
                        isLoading: false
                    });
                    throw error;
                }
            },

            logout: async () => {
                try {
                    await authAPI.logout();
                } catch (error) {
                    console.error('Logout error:', error);
                } finally {
                    localStorage.removeItem('fleetflow_token');
                    localStorage.removeItem('fleetflow_user');
                    set({
                        user: null,
                        token: null,
                        isAuthenticated: false,
                        error: null
                    });
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }
            },

            register: async (data) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await authAPI.register(data);
                    const { user, token } = response.data;

                    localStorage.setItem('fleetflow_token', token);
                    localStorage.setItem('fleetflow_user', JSON.stringify(user));

                    set({
                        user,
                        token,
                        isAuthenticated: true,
                        isLoading: false
                    });
                    return user;
                } catch (error) {
                    set({
                        error: error.message || 'Registration failed',
                        isLoading: false
                    });
                    throw error;
                }
            },

            getMe: async () => {
                try {
                    const response = await authAPI.getMe();
                    set({ user: response.data });
                } catch (error) {
                    console.error('Fetch me error:', error);
                    if (error.statusCode === 401) {
                        get().logout();
                    }
                }
            },

            updateProfile: async (data) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await authAPI.updateProfile(data);
                    set({ user: response.data, isLoading: false });
                    localStorage.setItem('fleetflow_user', JSON.stringify(response.data));
                    return response.data;
                } catch (error) {
                    set({
                        error: error.message || 'Update profile failed',
                        isLoading: false
                    });
                    throw error;
                }
            },

            clearError: () => set({ error: null })
        }),
        {
            name: 'fleetflow-auth',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
);
