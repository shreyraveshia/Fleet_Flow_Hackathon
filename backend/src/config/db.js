import mongoose from 'mongoose';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

const connectDB = async (retryCount = 0) => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log(`✅ MongoDB connected: ${conn.connection.host}`);

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB disconnected. Attempting reconnect...');
            setTimeout(() => connectDB(), RETRY_DELAY_MS);
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err.message);
        });
    } catch (error) {
        console.error(
            `❌ MongoDB connection failed (attempt ${retryCount + 1}/${MAX_RETRIES}): ${error.message}`
        );

        if (retryCount < MAX_RETRIES - 1) {
            console.log(`🔄 Retrying in ${RETRY_DELAY_MS / 1000}s...`);
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
            return connectDB(retryCount + 1);
        }

        console.error('💀 Max retries exceeded. Exiting process.');
        process.exit(1);
    }
};

export default connectDB;
