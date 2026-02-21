import 'dotenv/config';
import http from 'http';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import { initSocket } from './src/config/socket.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // 1. Connect to MongoDB first
        await connectDB();

        // 2. Create HTTP server from Express app
        const server = http.createServer(app);

        // 3. Initialize Socket.io on the HTTP server
        initSocket(server);

        // 4. Start listening
        server.listen(PORT, () => {
            console.log('');
            console.log('🚀 ─────────────────────────────────────────');
            console.log(`🚛 FleetFlow API Server`);
            console.log(`📍 Port     : ${PORT}`);
            console.log(`🌍 Env      : ${process.env.NODE_ENV}`);
            console.log(`🔗 URL      : http://localhost:${PORT}`);
            console.log(`❤️  Health   : http://localhost:${PORT}/health`);
            console.log('🚀 ─────────────────────────────────────────');
            console.log('');
        });

        // ─── Graceful Shutdown ─────────────────────────────────────────────────
        const shutdown = (signal) => {
            console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
            server.close(() => {
                console.log('✅ HTTP server closed.');
                process.exit(0);
            });

            // Force exit if graceful shutdown takes more than 10s
            setTimeout(() => {
                console.error('⚠️  Forced shutdown after 10s timeout.');
                process.exit(1);
            }, 10_000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        // ─── Unhandled rejections / exceptions ─────────────────────────────────
        process.on('unhandledRejection', (reason, promise) => {
            console.error('💥 Unhandled Rejection at:', promise, '\nReason:', reason);
            server.close(() => process.exit(1));
        });

        process.on('uncaughtException', (err) => {
            console.error('💥 Uncaught Exception:', err.message);
            console.error(err.stack);
            process.exit(1);
        });
    } catch (error) {
        console.error('💀 Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();
