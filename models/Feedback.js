const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,  // Ensure userId is required
        ref: 'User',     // Reference to the User model
    },
    instrumentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,  // Ensure instrumentId is required
        ref: 'Instrument',  // Reference to the Instrument model
    },
    feedback: {
        type: String,
        required: true,  // Ensure feedback is required
    },
    adminResponse: { type: String, default: '' }, 
}, { timestamps: true });

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
