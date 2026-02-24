require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const setupSocket = require('./socket/socketManager');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io Setup
setupSocket(server);

// Routes
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);

// Database removed - using in-memory storage for simplicity

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
