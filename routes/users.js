const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeAdmin, authorizeUser } = require('../middleware/authMiddleware');
const User = require('../models/User'); 

// User profile route (accessible to both admins and users)
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        // Fetch the user from the database using the user ID from the JWT token
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user); // Return the user's profile information
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

//Update Profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { firstName, lastName, email, username } = req.body; // Fields to update

        // Find the user by ID from the token
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the user fields (you can add more fields here)
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.email = email || user.email;
        user.username = username || user.username; // Update username

        await user.save(); // Save the updated user

        res.json(user); // Return the updated user profile
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all users (admin-only)
router.get('/', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const users = await User.find(); // Retrieves all users
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});



// Admin-only route (for example: deleting a user)
router.delete('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    const userId = req.params.id;

    try {
        // Delete the user by ID
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
