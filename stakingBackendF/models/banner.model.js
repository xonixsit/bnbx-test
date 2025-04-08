const mongoose = require("mongoose");
const { Schema } = mongoose;

const BannerModel = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        bannerImage: {
            type: String,
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

module.exports = mongoose.models.BannerModel || mongoose.model("BannerModel", BannerModel);