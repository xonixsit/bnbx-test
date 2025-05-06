const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
    tradingFunds: {
        type: String,
        required: true
    },
    safuFunds: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Portfolio', portfolioSchema);