const mongoose = require("mongoose");
const { Schema } = mongoose;

const LogSchema = new Schema(
    {
        type: {
            type: String,
            enum: ['CRON', 'INTEREST', 'ERROR', 'INFO','TRANSACTION'],
            default: 'INFO'
        },
        message: String,
        details: Schema.Types.Mixed,
        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

module.exports = mongoose.models.Log || mongoose.model("Log", LogSchema);