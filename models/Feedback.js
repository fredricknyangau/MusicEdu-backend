const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    instrumentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Instrument',
    },
    feedback: {
        type: String,
        required: true,
    },
    adminResponse: { type: String, default: '' }, 
}, { timestamps: true });

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
