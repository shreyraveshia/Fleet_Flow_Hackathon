import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const useSocket = () => {
    const { user, isAuthenticated } = useAuthStore();
    const [isConnected, setIsConnected] = useState(socket?.connected || false);

    useEffect(() => {
        if (isAuthenticated && user && !socket) {
            socket = io(SOCKET_URL, {
                withCredentials: true,
                transports: ['websocket', 'polling'],
            });

            socket.on('connect', () => {
                setIsConnected(true);
                console.log('🔌 Socket connected');

                // Join role-based room
                socket.emit('join_room', `role:${user.role}`);

                // Join personal room for notifications
                socket.emit('join_room', `user:${user._id}`);
            });

            socket.on('disconnect', () => {
                setIsConnected(false);
                console.log('🔌 Socket disconnected');
            });
        }

        // Cleanup on unmount or logout
        return () => {
            if (!isAuthenticated && socket) {
                socket.disconnect();
                socket = null;
                setIsConnected(false);
            }
        };
    }, [isAuthenticated, user]);

    const on = useCallback((event, cb) => {
        if (socket) socket.on(event, cb);
    }, []);

    const off = useCallback((event, cb) => {
        if (socket) socket.off(event, cb);
    }, []);

    const emit = useCallback((event, data) => {
        if (socket) socket.emit(event, data);
    }, []);

    return { on, off, emit, isConnected, socket };
};
