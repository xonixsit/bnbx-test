const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
    tradingFunds: {
        type: Number,
        required: true
    },
    safuFunds: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Portfolio', portfolioSchema);