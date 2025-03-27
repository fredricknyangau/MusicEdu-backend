const express = require('express');
const morgan = require('morgan'); // Logging middleware
const cors = require('cors'); // CORS middleware
const path = require('path'); 
const helmet = require('helmet'); // Security middleware
require('dotenv').config();
const serverless = require('serverless-http'); // Serverless middleware required for vercel deployment

const connectDB = require('./config/db');
const generateJWTSecret = require('./config/generateSecret'); // Import the secret generation function
const generateResetToken = require('./config/generateResetToken');

const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protectedRoutes');
const usersRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categoryRoutes');
const instrumentRoutes = require('./routes/instrumentRoutes');
const feedbacksRoutes = require('./routes/feedbackRoutes');
const securityLogsRoutes = require('./routes/securityLogs');

const { authenticateToken } = require('./middleware/authMiddleware');

const app = express();

// Generate secrets
generateJWTSecret(); // Generate JWT_SECRET if not present
generateResetToken();

// Middleware
app.use(cors({
    origin: 'https://music-edu.vercel.app', // Frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,  // Allow credentials (cookies)
    optionsSuccessStatus: 204  // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));

// Log CORS headers for debugging
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://music-edu.vercel.app');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    console.log('CORS headers set:', res.getHeaders());
    next();
});

app.use(express.json());
app.use(morgan('dev')); // Log requests to the console
app.use(helmet()); // Use Helmet for security
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Static folder for serving files (uploaded images, videos, and audio)


// Connect to database
connectDB();

// Routes
app.use('/api/auth', authRoutes); // Apply authentication middleware to protected routes
app.use('/api/users', usersRoutes);
app.use('/api', authenticateToken, protectedRoutes);
app.use('/api/categories', authenticateToken, categoryRoutes); // admins and users can access categories
app.use('/api/instruments', authenticateToken, instrumentRoutes); // Accessible by both users and admins
//app.use('/api', categoryRoutes);
//app.use('/api', instrumentRoutes);
app.use('/api/feedback', feedbacksRoutes);
app.use('/api/security-logs', securityLogsRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error' });
});

// Start server (localhost)
//const PORT = process.env.PORT || 5000;
//app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

//Export app for serverless deployment
module.exports = app;
module.exports.handler = serverless(app);
