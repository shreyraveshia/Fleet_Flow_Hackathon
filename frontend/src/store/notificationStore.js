import { create } from 'zustand';
import { notificationAPI } from '../api/notification.api';

export const useNotificationStore = create((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,

    fetchNotifications: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await notificationAPI.getAll();
            set({ notifications: response.data, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchUnreadCount: async () => {
        try {
            const response = await notificationAPI.getUnreadCount();
            set({ unreadCount: response.data.count });
        } catch (error) {
            console.error('Unread count error:', error);
        }
    },

    markAsRead: async (id) => {
        try {
            await notificationAPI.markAsRead(id);
            set((state) => ({
                notifications: state.notifications.map((n) =>
                    n._id === id ? { ...n, isRead: true } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1),
            }));
        } catch (error) {
            console.error('Mark read error:', error);
        }
    },

    markAllRead: async () => {
        try {
            await notificationAPI.markAllRead();
            set((state) => ({
                notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
                unreadCount: 0,
            }));
        } catch (error) {
            console.error('Mark all read error:', error);
        }
    },

    addNotification: (notification) => {
        set((state) => ({
            notifications: [notification, ...state.notifications].slice(0, 50),
            unreadCount: state.unreadCount + 1,
        }));
    },

    deleteNotification: async (id) => {
        try {
            const notification = get().notifications.find(n => n._id === id);
            await notificationAPI.delete(id);
            set((state) => ({
                notifications: state.notifications.filter((n) => n._id !== id),
                unreadCount: notification && !notification.isRead ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
            }));
        } catch (error) {
            console.error('Delete notification error:', error);
        }
    },
}));
