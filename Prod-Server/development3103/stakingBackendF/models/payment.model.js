const mongoose = require("mongoose");
const { Schema } = mongoose;

const Payment = new Schema(
    {
        user: { 
            type: Schema.Types.ObjectId, 
            ref: "User" 
        },
        senderAddress: { 
            type: String, 
        },
        recepientAddress: { 
            type: String, 
            required: true 
        },
        amount: { 
            type: String, 
            required: true 
        },
        isVerified: { 
            type: Boolean, 
            default: false 
        },
        verifiedByUser: { 
            type: String, 
            default: null 
        },
        transactionHash: { 
            type: String 
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.models.Payment || mongoose.model("Payment", Payment);
