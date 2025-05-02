const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const { authenticateToken } = require('../middleware/authMiddleware');  // Import your auth middleware

// POST route to save feedback
router.post('/', authenticateToken, async (req, res) => {
    // Log the decoded user and feedback data for debugging
    // console.log('Decoded user:', req.user);  // Log decoded user from the token
    // console.log('Feedback data:', req.body);  // Log feedback data coming in the request

    // Check if the user ID is available in the decoded token
    if (!req.user || !req.user.userId) {
        return res.status(400).json({ message: 'User ID is missing or invalid.', user: req.user });
    }

    // Check if the feedback and instrument ID are present in the body
    if (!req.body.instrumentId || !req.body.feedback) {
        if (!req.body.instrumentId) {
            return res.status(400).json({ message: 'Instrument ID is required.' });
        }
        if (!req.body.feedback) {
            return res.status(400).json({ message: 'Feedback is required.' });
        }
    }

    // Create a new feedback object with data from the user and request body
    const newFeedback = new Feedback({
        userId: req.user.userId,  // Using the decoded userId from the JWT token
        instrumentId: req.body.instrumentId,  // Get the instrument ID from the request body
        feedback: req.body.feedback,  // Get the feedback text from the request body
    });
        console.error('Error saving feedback:', error.message);  // Log error message for debugging
    try {
        await newFeedback.save();  // Save feedback to the database
        res.status(201).json(newFeedback);  // Respond with the created feedback object
    } catch (error) {
        console.error('Error saving feedback:', error.message);  // Log error message for debugging
        res.status(500).json({ message: 'Error saving feedback', error: error.message });
    }
});

// GET route to fetch all feedbacks
router.get('/', authenticateToken, async (req, res) => {
    try {
        // Fetch all feedbacks
        const feedbacks = await Feedback.find();
        res.status(200).json(feedbacks);
    } catch (error) {
        console.error('Error fetching feedbacks:', error.message);
        res.status(500).json({ message: 'Error fetching feedbacks', error: error.message });
    }
});

// POST route to save admin response to feedback
router.post('/:id/response', authenticateToken, async (req, res) => {
    const feedbackId = req.params.id;
    const { response } = req.body;

    if (!response) {
        return res.status(400).json({ message: 'Response is required' });
    }

    try {
        const feedback = await Feedback.findById(feedbackId);
        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        feedback.adminResponse = response;
        await feedback.save();

        res.status(200).json({ message: 'Response saved successfully', feedback });
    } catch (error) {
        console.error('Error responding to feedback:', error.message);
        res.status(500).json({ message: 'Error responding to feedback', error: error.message });
    }
});



module.exports = router;
