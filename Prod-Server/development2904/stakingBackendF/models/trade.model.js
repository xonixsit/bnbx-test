const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
    image: {
        data: Buffer,
        contentType: String
    },
    filename: String
}, { timestamps: true });

module.exports = mongoose.model('Trade', tradeSchema);