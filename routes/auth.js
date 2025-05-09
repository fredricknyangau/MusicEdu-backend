const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const router = express.Router();

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ msg: "Validation error", errors: errors.array() });
  }
  next();
};

// Signup route
router.post(
  "/signup",
  [
    body("fullName").notEmpty().withMessage("Full name is required"),
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please provide a valid email address"),
    body("username")
      .notEmpty()
      .withMessage("Username is required")
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long"),
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/[a-z]/)
      .withMessage("Password must contain at least one lowercase letter")
      .matches(/\d/)
      .withMessage("Password must contain at least one number")
      .matches(/[!@#$%^&*(),.?":{}|<>]/)
      .withMessage("Password must contain at least one special character"),
    handleValidationErrors,
  ],
  async (req, res) => {
    const { fullName, email, username, password } = req.body;

    try {
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        const duplicateField =
          existingUser.email === email ? "email" : "username";
        return res.status(400).json({
          msg: `${
            duplicateField === "email" ? "Email" : "Username"
          } already exists`,
          errors: [
            {
              field: duplicateField,
              message: `${
                duplicateField.charAt(0).toUpperCase() + duplicateField.slice(1)
              } already in use`,
            },
          ],
        });
      }


      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        fullName,
        email,
        username,
        password: hashedPassword,
      });

      await newUser.save();

      res.status(201).json({ msg: "User registered successfully" });
    } catch (error) {
      console.error("Error during signup:", error);
      res.status(500).json({ msg: "Server error", error: error.message });
    }
  }
);

// Login route
router.post(
  "/login",
  [
    body("identifier").notEmpty().withMessage("Email or username is required"),
    body("password").notEmpty().withMessage("Password is required"),
    handleValidationErrors,
  ],
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
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          lastLogin: new Date(),
        },
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ msg: "Server error", error: error.message });
    }
  }
);

// Google Login route
router.post("/google", async (req, res) => {
  const { email, name, picture, provider } = req.body;

  if (!email || !name || !provider) {
    return res.status(400).json({ msg: "Missing required Google user data." });
  }

  try {
    let user = await User.findOne({ email });

    // Create user if not existing
    if (!user) {
      user = new User({
        fullName: name,
        email,
        username: email.split("@")[0], // use email prefix as default username
        picture,
        provider,
        role: "user", // or "admin" depending on your logic
      });

      await user.save();
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      msg: "Google login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        picture: user.picture,
      },
    });
  } catch (error) {
    console.error("Error during Google login:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
});


// Forgot password route
router.post(
  "/forgot-password",
  [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please provide a valid email address"),
    handleValidationErrors,
  ],
  async (req, res) => {
    const { email } = req.body;

    try {
      // Logic to send password reset email (e.g., generate token and send email)
      res.status(200).json({ msg: "Password reset instructions sent to your email" });
    } catch (error) {
      console.error("Error during forgot password:", error);
      res.status(500).json({ msg: "Server error", error: error.message });
    }
  }
);

// Reset password route
router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Token is required"),
    body("newPassword")
      .notEmpty()
      .withMessage("New password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
    handleValidationErrors,
  ],
  async (req, res) => {
    const { token, newPassword } = req.body;

    try {
      // Logic to verify token and reset password
      res.status(200).json({ msg: "Password reset successfully" });
    } catch (error) {
      console.error("Error during reset password:", error);
      res.status(500).json({ msg: "Server error", error: error.message });
    }
  }
);

module.exports = router;
