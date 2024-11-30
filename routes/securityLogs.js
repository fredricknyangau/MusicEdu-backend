// backend/routes/securityLogs.js

const express = require('express');
const router = express.Router();
const SecurityLog = require('../models/SecurityLog');
const { authenticateToken } = require('../middleware/authMiddleware');  // Assuming you have an auth middleware

// Route to fetch all security logs (accessible to authorized users)
router.get('/', authenticateToken, async (req, res) => {
    try {
        // Fetch security logs from the database
        const logs = await SecurityLog.find();  // This fetches all logs
        if (!logs.length) {
            return res.status(200).json([]);
        }
        res.status(200).json(logs);  // Return the logs as JSON
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching security logs' });
    }
});

// Route to store a new security log (accessible to admins or authorized users)
router.post('/', async (req, res) => {
    const { action, user, additionalInfo } = req.body;

    // Check if required fields are present
    if (!action || !user) {
        return res.status(400).json({ message: 'Action and user are required fields' });
    }

    try {
        // Create a new security log document
        const newLog = new SecurityLog({
            action,
            user,
            additionalInfo,
            actionDetails,
        });

        // Save the log to the database
        await newLog.save();

        // Respond with success message
        res.status(200).json({ message: 'Log stored successfully' });
    } catch (error) {
        console.error('Error storing log:', error);
        res.status(500).json({ message: 'Failed to store log' });
    }
});

module.exports = router;
