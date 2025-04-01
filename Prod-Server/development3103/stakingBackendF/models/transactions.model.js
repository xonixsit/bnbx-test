const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { Schema } = mongoose;

const Transaction = new Schema(
    {
        stakingId: {
            type: Schema.Types.ObjectId,
            ref: "Transaction",
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        fromUser: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        chain: {
            type: String,
            default: "BSC",
        },
        balanceType: {
            type: String,
            enum: ["BUSD", "TRADE"],
            default: "BUSD",
        },
        currentBalance: {
            type: Number,
            required: true,
            default: 0,
        },
        transactionType: {
            type: String,
            enum: [
                "BURN",
                "DEPOSIT",
                "BOND-IN",
                "WITHDRAW",
                "CONVERT-REWARD",
                "BOND-REWARD",
                "SIGNUP-BONUS",
                "LEVEL-AIR-DROP",
                "REFER-INCOME",
                "FUND-TRANSFER",
                "RANK-UPGRADE-BONUS",
                "DELEGATED-REWARD",
                "SWAP-BUSD-TO-TRADE",
                "MAIN-TO-TRADE",
                "TRADE-TO-MAIN",
                "RETURN-INTEREST",
                "STAKE-UNLOCKED"
            ],
            required: true,
        },
        blockNumber: {
            type: String,
        },
        txHash: {
            type: String,
        },
        amount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["COMPLETED", "REQUESTED", "FAILED", "PENDING", "REJECTED", "REVERSED"],
            default: "COMPLETED"
        },
        level: {
            type: Number,
        },
        
        description: {
            type: String,
        },
        withdrawalSource: {
            type: String,
            enum: ['DEPOSIT', 'REFER-INCOME', 'SIGNUP-BONUS'],
            // Only required when transactionType is WITHDRAW
            required: function() {
                return this.transactionType === 'WITHDRAW';
            }
        },
        approvedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            // required: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        // Add this to your existing schema
        planDetails: {
            planId: Number,
            planName: String,
            dailyRate: {
                type: Number,
                required: function() {
                    return this.transactionType === 'DEPOSIT';
                }
            },
            lockPeriod: {
                type: Number,
                required: function() {
                    return this.transactionType === 'DEPOSIT';
                }
            }
        }
    },
    {
        timestamps: true,
    },
);

Transaction.plugin(mongoosePaginate);
module.exports = mongoose.models.Transaction || mongoose.model("Transaction", Transaction);
