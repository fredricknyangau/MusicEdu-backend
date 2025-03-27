const express = require('express');
const connectDB = require('./config/db');
const generateJWTSecret = require('./config/generateSecret');
const generateResetToken = require('./config/generateResetToken');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protectedRoutes');
const usersRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categoryRoutes');
const instrumentRoutes = require('./routes/instrumentRoutes');
const feedbacksRoutes = require('./routes/feedbackRoutes');
const securityLogsRoutes = require('./routes/securityLogs');
const { authenticateToken } = require('./middleware/authMiddleware');

// Generate secrets if not present
generateJWTSecret();
generateResetToken();

const app = express();

// CORS Configuration
app.use(cors({
    origin: ['https://music-edu.vercel.app', 'https://music-edu-backend.vercel.app'], // Allow multiple origins if needed
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Include OPTIONS for preflight requests
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

// Add middleware to handle preflight requests
app.options('*', cors());

app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());

// Connect to Database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/categories', authenticateToken, categoryRoutes);
app.use('/api/instruments', authenticateToken, instrumentRoutes);
app.use('/api/feedback', feedbacksRoutes);
app.use('/api/security-logs', securityLogsRoutes);
app.use('/api', authenticateToken, protectedRoutes);

// Serve Static Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
