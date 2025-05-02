const mongoose = require('mongoose');

const InstrumentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    historicalBackground: { type: String, required: true },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    image: { type: String, required: true },
    video: { type: String },
    audio: { type: String }
});

module.exports = mongoose.model('Instrument', InstrumentSchema);
