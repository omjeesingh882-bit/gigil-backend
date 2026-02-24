require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const setupSocket = require('./socket/socketManager');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Socket.io Setup
setupSocket(server);

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Database removed - using in-memory storage for simplicity

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
