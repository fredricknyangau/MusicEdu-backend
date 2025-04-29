const express = require("express");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const router = express.Router();
require("dotenv").config();

// Check for required environment variables
if (
  !process.env.JWT_SECRET ||
  !process.env.MAIL_USERNAME ||
  !process.env.MAIL_PASSWORD ||
  !process.env.FRONTEND_URL
) {
  throw new Error("Missing required environment variables");
}

// Utility function for sending emails
const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.MAIL_USERNAME,
      to,
      subject,
      text,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

// Reusable validation rules
const validateIdentifier = body("identifier")
  .notEmpty()
  .withMessage("Identifier is required")
  .isLength({ min: 3 })
  .withMessage("Identifier must be at least 3 characters.")
  .custom((value) => {
    if (!/\S+@\S+\.\S+/.test(value) && value.length < 3) {
      throw new Error("Please provide a valid email or username");
    }
    return true;
  })
  .trim();

const validatePassword = body("password")
  .notEmpty()
  .withMessage("Password is required")
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters.")
  .matches(/[A-Z]/)
  .withMessage("Password must contain at least one uppercase letter.")
  .matches(/[a-z]/)
  .withMessage("Password must contain at least one lowercase letter.")
  .matches(/\d/)
  .withMessage("Password must contain at least one number.")
  .matches(/[!@#$%^&*(),.?":{}|<>]/)
  .withMessage("Password must contain at least one special character.")
  .trim();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array());
    return res
      .status(400)
      .json({ msg: "Validation error", errors: errors.array() });
  }
  next();
};

// Rate limiting for sensitive routes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: "Too many login attempts. Please try again later.",
});

// Sign Up Route
router.post(
  "/signup",
  [validateIdentifier, validatePassword, handleValidationErrors],
  async (req, res) => {
    const { firstName, lastName, email, username, password, role } = req.body;

    try {
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });
      if (existingUser) {
        return res.status(400).json({ msg: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        firstName,
        lastName,
        email,
        username,
        password: hashedPassword,
        role: role || "user",
      });
      await newUser.save();

      const token = jwt.sign(
        { id: newUser._id, role: newUser.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.status(201).json({
        msg: "User registered successfully",
        token,
        user: {
          id: newUser._id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          role: newUser.role,
        },
      });
    } catch (error) {
      console.error("Error during signup:", error);
      res.status(500).json({ msg: "Server error", error: error.message });
    }
  }
);

// Login Route
router.post(
  "/login",
  loginLimiter,
  [validateIdentifier, validatePassword, handleValidationErrors],
  async (req, res) => {
    const { identifier, password } = req.body;

    try {
      const user = await User.findOne({
        $or: [{ email: identifier }, { username: identifier }],
      });

      if (!user) {
        return res.status(400).json({ msg: "User not found" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.status(200).json({
        msg: "Logged in successfully",
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ msg: "Server error", error: error.message });
    }
  }
);

// Forgot Password Route
router.post("/forgot-password", async (req, res) => {
  const { identifier } = req.body;

  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendEmail(
      user.email,
      "Password Reset Request",
      `To reset your password, click on this link: ${resetLink}`
    );

    res.json({ msg: "Password reset email sent successfully" });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res
      .status(500)
      .json({ msg: "Failed to send reset instructions. Please try again." });
  }
});

// Reset Password Route
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({
          msg: "Invalid or expired token. Please request a new password reset.",
        });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ msg: "Password has been reset successfully" });
  } catch (error) {
    console.error("Error in reset password:", error);
    res
      .status(500)
      .json({ msg: "Failed to reset password. Please try again." });
  }
});

module.exports = router;
