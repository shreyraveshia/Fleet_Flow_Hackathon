import { Server } from 'socket.io';
import { SOCKET_EVENTS } from './constants.js';

let io;

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true,
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Socket connected: ${socket.id}`);

        // Join role-based room
        socket.on(SOCKET_EVENTS.JOIN_ROOM, ({ userId, role }) => {
            if (userId) {
                socket.join(`user:${userId}`);
            }
            if (role) {
                socket.join(`role:${role}`);
            }
            socket.join('global');
            console.log(
                `📡 Socket ${socket.id} joined rooms: user:${userId}, role:${role}, global`
            );
        });

        // Leave specific room
        socket.on(SOCKET_EVENTS.LEAVE_ROOM, ({ room }) => {
            socket.leave(room);
            console.log(`📴 Socket ${socket.id} left room: ${room}`);
        });

        // Driver sends location update during trip
        socket.on(SOCKET_EVENTS.TRIP_LOCATION_UPDATED, (data) => {
            const { tripId, latitude, longitude, driverId } = data;
            if (!tripId || latitude == null || longitude == null) return;

            // Broadcast to admins, managers, and the specific trip room
            io.to('role:admin')
                .to('role:manager')
                .to(`trip:${tripId}`)
                .emit(SOCKET_EVENTS.TRIP_LOCATION_UPDATED, {
                    tripId,
                    latitude,
                    longitude,
                    driverId,
                    timestamp: new Date().toISOString(),
                });
        });

        socket.on('disconnect', (reason) => {
            console.log(`🔌 Socket disconnected: ${socket.id} — reason: ${reason}`);
        });

        socket.on('error', (err) => {
            console.error(`Socket error on ${socket.id}:`, err.message);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized. Call initSocket() first.');
    }
    return io;
};

/**
 * Emit a notification to a specific user
 */
export const emitToUser = (userId, event, data) => {
    if (!io) return;
    io.to(`user:${userId}`).emit(event, data);
};

/**
 * Emit to all users with a specific role
 */
export const emitToRole = (role, event, data) => {
    if (!io) return;
    io.to(`role:${role}`).emit(event, data);
};

/**
 * Emit to all connected clients
 */
export const emitToAll = (event, data) => {
    if (!io) return;
    io.to('global').emit(event, data);
};

/**
 * Emit a trip status/location update
 */
export const emitTripUpdate = (tripId, event, data) => {
    if (!io) return;
    io.to('role:admin')
        .to('role:manager')
        .to(`trip:${tripId}`)
        .emit(event, data);
};
