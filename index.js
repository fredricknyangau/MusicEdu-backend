const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
require("dotenv").config();

const connectDB = require("./config/db");
const generateJWTSecret = require("./config/generateSecret");
const generateResetToken = require("./config/generateResetToken");

const authRoutes = require("./routes/auth");
const protectedRoutes = require("./routes/protectedRoutes");
const usersRoutes = require("./routes/users");
const categoryRoutes = require("./routes/categoryRoutes");
const instrumentRoutes = require("./routes/instrumentRoutes");
const feedbacksRoutes = require("./routes/feedbackRoutes");
const securityLogsRoutes = require("./routes/securityLogs");

const { authenticateToken } = require("./middleware/authMiddleware");

const app = express();

// Generate secrets
generateJWTSecret();
generateResetToken();

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }

      const allowedOrigins = [
        "http://localhost:3000", // Localhost for development
        "https://music-edu.vercel.app", // Production URL
      ];

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue: false,
    maxAge: 86400, // 24 hours
  })
);

// Add CORS headers for all responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Expose-Headers", "Content-Range, X-Content-Range");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

app.use(express.json());
app.use(morgan("dev"));
app.use(helmet());

// Serve static files with proper CORS headers
app.use(
  "/uploads",
  cors({
    origin: "*",
    methods: ["GET", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Length", "X-Foo", "X-Bar"],
  }),
  express.static(path.join(__dirname, "uploads"))
);

// Connect to DB
connectDB().catch((err) => {
  console.error("Database connection failed:", err);
  process.exit(1);
});

// Routes
app.use("/api", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/protected", authenticateToken, protectedRoutes);
app.use("/api/categories", authenticateToken, categoryRoutes);
app.use("/api/instruments", authenticateToken, instrumentRoutes);
app.use("/api/feedback", feedbacksRoutes);
app.use("/api/security-logs", securityLogsRoutes);

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
