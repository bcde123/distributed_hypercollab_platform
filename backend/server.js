require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
console.log('hi');
const router = require('./src/routes/auth');
const workspaceRoutes = require('./src/routes/workspaces');
const cookieParser = require('cookie-parser');
const boardRoutes = require('./src/routes/boards');
const cors=require('cors');
const  chatRoutes  = require('./src/routes/chat');
const app =   express();
const PORT = process.env.PORT || 5001;
// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// app.options("*", cors());


app.use(express.json());
app.use(cookieParser());


// Database connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/auth',router);
app.use('/api',workspaceRoutes);
// This structure ensures :workspaceId is available in req.params for the RBAC middleware
app.use('/api/workspaces/:workspaceId/boards', boardRoutes);

// chat
app.use("/api/chat", chatRoutes);
// Basic route

app.get('/', (req, res) => {
    res.send('HyperCollab API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

global.wss = wss; // IMPORTANT (so controller can access)

wss.on("connection", (ws) => {
  console.log("🔌 Client connected");

  ws.on("close", () => {
    console.log("❌ Client disconnected");
  });
});