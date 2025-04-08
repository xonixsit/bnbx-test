const mongoose = require("mongoose");
const { Schema } = mongoose;

const EventModel = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.models.EventModel || mongoose.model("EventModel", EventModel);