const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const generateToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
};

exports.register = async (req, res) => {
  try {
    const { fullName, email, username, password } = req.body;

    // Check if the email or username already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        msg: "Email or Username already exists",
        errors: [
          {
            field: "emailOrUsername",
            message: "Email or Username already exists",
          },
        ],
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      fullName,
      email,
      username,
      password: hashedPassword,
    });

    await newUser.save();

    // Generate token
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET
    );

    res.status(201).json({
      msg: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return res.status(400).json({ msg: "Validation error", errors });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        msg: "Duplicate field error",
        errors: [
          {
            field,
            message: `${
              field.charAt(0).toUpperCase() + field.slice(1)
            } already exists`,
          },
        ],
      });
    }

    res.status(500).json({ msg: "Server error", error: error.message });
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
            user: { id: user._id, fullName: user.fullName, email: user.email }
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
};
