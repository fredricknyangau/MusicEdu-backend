const express = require('express');
const router = express.Router();
const { authorizeUser, authorizeAdmin } = require('../middleware/authMiddleware');

// User dashboard - only accessible by users
router.get('/dashboard', authorizeUser, (req, res) => {
    res.json({ message: 'User Dashboard' });
});

// Admin dashboard - only accessible by admins
router.get('/admin', authorizeAdmin, (req, res) => {
    res.json({ message: 'Admin Dashboard' });
});

module.exports = router;
