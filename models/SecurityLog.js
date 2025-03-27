const mongoose = require('mongoose');

const securityLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true
    },
    user: {
        type: String,
        required: true
    },
    additionalInfo: {
        type: String,
        required: true
    },
    actionDetails: {
        type: String,
        required: false // This field is optional
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SecurityLog', securityLogSchema);
