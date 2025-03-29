const express = require('express');
const morgan = require('morgan'); // Logging middleware
const cors = require('cors'); // CORS middleware
const path = require('path'); 
const helmet = require('helmet'); // Security middleware
require('dotenv').config();
const serverless = require('serverless-http'); // Serverless middleware required for Vercel deployment

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
    origin: '*', // Allow all origins for testing; restrict in production if needed
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'], // Expose custom headers to the client
    credentials: true,
    optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(morgan('dev')); // Log requests to the console
app.use(helmet()); // Use Helmet for security

// Serve static files with proper CORS headers
app.use('/uploads', cors({
    origin: '*', // Allow all origins for static files
    methods: ['GET', 'OPTIONS'], // Allow only GET and OPTIONS for static files
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
}), express.static(path.join(__dirname, 'uploads')));

// Connect to database with error handling
connectDB().catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1); // Exit process if DB connection fails
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api', authenticateToken, protectedRoutes);
app.use('/api/categories', authenticateToken, categoryRoutes);
app.use('/api/instruments', authenticateToken, instrumentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/instruments', instrumentRoutes);
app.use('/api/feedback', feedbacksRoutes);
app.use('/api/security-logs', securityLogsRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error' });
});

// Health check route
app.get("/", (req, res) => {
    res.status(200).json({ message: "Server is running" });
});

// Export app for serverless deployment
module.exports = app;
module.exports.handler = serverless(app);
