const mongoose = require("mongoose");
const { Schema } = mongoose;
const mongoosePaginate = require("mongoose-paginate-v2");

const ThreadSchema = new Schema({
    message: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    reply: [
      {
        message: {
          type: String,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  });  

const Support = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "UserModel",
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        tokenId: {
            type: Number,
            require: true,
        },
        desc: {
            type: String,
        },
        adminReplay: {
            type: String,
        },
        title: {
            type: String,
            required: true,
        },
        image: {
            type: Array,
        },
        status: {
            type: String,
            enum: ["completed", "pending", "rejected", "cancelled", "reopen"],
            required: true,
            default: "pending",
        },
        thread: [ThreadSchema],
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    },
);

Support.plugin(mongoosePaginate);

module.exports = mongoose.models.Support || mongoose.model("Support", Support);
