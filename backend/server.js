require('dotenv').config();
console.log('hi');
const express = require('express');
const mongoose = require('mongoose');
const router = require('./src/routes/auth');
const workspaceRoutes = require('./src/routes/workspaces');
const cookieParser = require('cookie-parser');
const boardRoutes = require('./src/routes/boards');
const cors=require('cors');
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

// Basic route

app.get('/', (req, res) => {
    res.send('HyperCollab API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
