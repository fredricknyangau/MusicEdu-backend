const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const generateToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
};

exports.register = async (req, res) => {
    try {
        const { firstName, lastName, email, username, password } = req.body;

        // Check if the email or username already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ msg: 'Email or Username already exists' });
        }

        // Hash the password before saving it to the database
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ firstName, lastName, email, username, password: hashedPassword });
        await newUser.save();

        // Create JWT token
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);

        // Respond with the user data and the token
        res.status(201).json({
            msg: 'User registered successfully',
            token,
            user: { id: newUser._id, firstName: newUser.firstName, lastName: newUser.lastName, email: newUser.email }
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body; // identifier can be either email or username

        // Find the user by email or username
        const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
        if (!user) {
            return res.status(400).json({ msg: 'User not found' });
        }

        // Compare the password with the stored hash
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ msg: 'Invalid password' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        // Respond with the user data and the token
        res.status(200).json({
            msg: 'Logged in successfully',
            token,
            user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email }
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
};
