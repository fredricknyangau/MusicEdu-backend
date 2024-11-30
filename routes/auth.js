const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Import bcrypt for hashing
const { body, validationResult } = require('express-validator'); // Import express-validator for input validation
const nodemailer = require('nodemailer');
const router = express.Router();
require('dotenv').config();

// Middleware for input validation
const validateInput = [
    // Validate identifier (email or username)
    body('identifier')
        .isLength({ min: 3 }).withMessage('Identifier must be at least 3 characters.')
        .custom((value) => {
            // Check if it looks like an email address
            if (!/\S+@\S+\.\S+/.test(value) && value.length < 3) {
                throw new Error('Please provide a valid email or username');
            }
            return true;
        })
        .trim(),
    // Validate password
    body('password')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.')
        .trim(),
    // Handle validation errors
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array()); // Log validation errors for inspection
            return res.status(400).json({ msg: 'Validation error', errors: errors.array() });
        }
        next();
    }
];

// Sign Up Route
router.post('/signup', async (req, res) => {
    const { firstName, lastName, email, username, password, role } = req.body;

    try {
        // Check if user exists by email or username
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({ firstName, lastName, email, username, password: hashedPassword, role: role || 'user' });
        await newUser.save();

        // Create JWT
        const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET);

        res.status(201).json({
            msg: 'User registered successfully',
            token,
            user: { id: newUser._id, firstName: newUser.firstName, lastName: newUser.lastName, email: newUser.email, role: newUser.role },
        });
    } catch (error) {
        console.error("Error during signup:", error); // Log the full error for debugging
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
});

// Login Route
router.post('/login', validateInput, async (req, res) => {
    console.log('Received login payload:', req.body); // Log request body for debugging
    const { identifier, password } = req.body;

    try {
        // Find user by email or username
        const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
        if (!user) {
            return res.status(400).json({ msg: 'User not found' });
        }

        // Compare entered password with stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET);

        // Send user data and token as response
        res.status(200).json({
            msg: 'Logged in successfully',
            token,
            user: { 
                id: user._id, 
                firstName: user.firstName, 
                lastName: user.lastName, 
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Error during login:", error); // Log the full error for debugging
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
});

// Create transporter for sending emails
const transporter = nodemailer.createTransport({
    service: 'gmail',  // You can use other services like Outlook, etc.
    auth: {
        user: process.env.MAIL_USERNAME,  // From .env
        pass: process.env.MAIL_PASSWORD,  // From .env
    }
});

// Forgot Password Route
router.post('/forgot-password', async (req, res) => {
    const { identifier } = req.body;

    try {
        const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Generate reset token
        const resetToken = jwt.sign({ userId: user._id }, process.env.RESET_TOKEN_SECRET, { expiresIn: '1h' });
        const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

        // Send reset email
        await transporter.sendMail({
            from: process.env.MAIL_USERNAME,
            to: user.email,
            subject: 'Password Reset Request',
            text: `To reset your password, click on this link: ${resetLink}`,
        });

        res.json({ msg: 'Password reset email sent succesfully' });
    } catch (error) {
        console.error("Error in forgot password:", error);
        res.status(500).json({ msg: 'Failed to send reset instructions. Please try again.' });
    }
});

// Reset Password Route
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.RESET_TOKEN_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ msg: 'Password has been reset successfully' });
    } catch (error) {
        console.error("Error in reset password:", error);
        res.status(500).json({ msg: 'Failed to reset password. Please try again.' });
    }
});

module.exports = router;
