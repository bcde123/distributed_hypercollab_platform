require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const router = require('./src/routes/auth');
const workspaceRoutes = require('./src/routes/workspaces');
const cookieParser = require('cookie-parser');
const boardRoutes = require('./src/routes/boards');
const cors = require('cors');
const chatRoutes = require('./src/routes/chat');
const analyticsRoutes = require('./src/routes/analytics');
const { initWebSocketServer } = require('./src/websocket/socketServer');

const app = express();
const PORT = process.env.PORT || 5001;

// CORS — read allowed origins from env so the same image works locally and in Docker.
// CORS_ORIGIN can be a comma-separated list, e.g. "http://localhost,http://localhost:5173"
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Database connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));

// Kafka Producer Connection
const { connectProducer, disconnectKafka } = require('./src/config/kafka');
connectProducer();

// Graceful shutdown
const shutdown = async (signal) => {
    console.log(`\n${signal} received — shutting down gracefully`);
    await disconnectKafka();
    process.exit(0);
};
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Routes
app.use('/api/auth', router);
app.use('/api', workspaceRoutes);
// This structure ensures :workspaceId is available in req.params for the RBAC middleware
app.use('/api/workspaces/:workspaceId/boards', boardRoutes);
app.use('/api/workspaces/:workspaceId/analytics', analyticsRoutes);


// chat
app.use("/api/chat", chatRoutes);

// Health check — used by docker-compose healthcheck and uptime monitors
app.get('/health', (req, res) => {
    const dbState = mongoose.connection.readyState; // 1 = connected
    if (dbState === 1) {
        res.json({ status: 'ok', db: 'connected' });
    } else {
        res.status(503).json({ status: 'degraded', db: 'disconnected' });
    }
});

// Basic root route
app.get('/', (req, res) => {
    res.send('HyperCollab API is running');
});

// Create HTTP server and attach WebSocket
const server = http.createServer(app);
initWebSocketServer(server);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});