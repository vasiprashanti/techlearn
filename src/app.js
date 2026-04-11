// src/app.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import config
const redisClient = require('./config/redis');
const queueService = require('./services/queueService');

// Import workers
const runWorker = require('./workers/runWorker');
const submitWorker = require('./workers/submitWorker');

// Import routes
const authRoutes = require('./routes/authRoutes');
const questionRoutes = require('./routes/questionRoutes');
const runRoutes = require('./routes/runRoutes');
const submitRoutes = require('./routes/submitroutes');

const app = express();

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', questionRoutes);
app.use('/api/student', runRoutes);
app.use('/api/student', submitRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date(),
        uptime: process.uptime(),
        services: {
            mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            redis: redisClient.client ? 'connected' : 'disconnected'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000
        });
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};

// Start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();
        
        // Connect to Redis
        await redisClient.connect();
        
        // Initialize queues
        await queueService.initialize();
        
        // Initialize workers
        await runWorker.initialize();
        await submitWorker.initialize();
        
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`\n🚀 ========================================`);
            console.log(`🚀 TRACE Coding Engine Started Successfully!`);
            console.log(`🚀 ========================================`);
            console.log(`📡 Server running on: http://localhost:${PORT}`);
            console.log(`❤️  Health check: http://localhost:${PORT}/health`);
            console.log(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth/login`);
            console.log(`📊 API endpoint: http://localhost:${PORT}/api/student/today-question`);
            console.log(`========================================\n`);
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n⚠️  Shutting down gracefully...');
    await mongoose.connection.close();
    if (redisClient.client) await redisClient.client.quit();
    process.exit(0);
});

startServer();

module.exports = app;