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
const { initWebSocketServer } = require('./src/websocket/socketServer');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
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

// chat
app.use("/api/chat", chatRoutes);

// Basic route
app.get('/', (req, res) => {
    res.send('HyperCollab API is running');
});

// Create HTTP server and attach WebSocket
const server = http.createServer(app);
initWebSocketServer(server);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});