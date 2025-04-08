const mongoose = require("mongoose");
const { Schema } = mongoose;
const mongoosePaginate = require("mongoose-paginate-v2");

const User = new Schema(
    {
        referralCode: {
            type: String,
            default: null,
        },
        loginId:{
            type: String,
            // required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 255,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        mobile: {
            type: String,
            required: true,
            unique: true,
        },
        fromUser: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        role: {
            type: String,
            enum: ["USER", "ADMIN"],
            default: "USER",
        },
        password: {
            type: String,
            select: false,
        },
        profileImage: {
            type: String,
        },
        BUSDBalance: {
            type: Number,
            required: true,
            default: 0,
        },
        TRADEBalance: {
            type: Number,
            required: true,
            default: 0,
        },
        bonusBalance: {
            type: Number,
        },
        totalStakedBalance: {
            type: Number,
            required: true,
            default: 0,
        },
        totalWithdrawalBalance: {
            type: Number,
            default: 0,
        },
        totalTeamTurnoverBalance: {
            type: Number,
            required: true,
            default: 0,
        },
        totalDirectTeamTurnoverBalance: {
            type: Number,
            default: 0,
        },
        totalRemovedStakedBalance: {
            type: Number,
            required: true,
            default: 0
        },
        totalInternalTransferBalance: {
            type: Number,
            default: 0,
        },
        totalDelegateRewardBalance: {
            type: Number,
            default: 0,
        },
        totalUnlockRewardBalnce: {
            type: Number,
            required: true,
            default: 0,
        },
        totalReferralRewardBalance: {
            type: Number,
            required: true,
            default: 0,
        },
        totalStakingRewardBalance: {
            type: Number,
            required: true,
            default: 0,
        },
        totalRankBonusBalance: {
            type: Number,
            required: true,
            default: 0,
        },
        totalRewardBalance: {
            type: Number,
            required: true,
            default: 0,
        },
        trxPassword: {
            type: String,
            select: false,
        },
        isTrxPassCreated: {
            type: Boolean,
            default: false,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        isMobileVerified: {
            type: Boolean,
            default: false,
        },
        isWithdrawAllowed: {
            type: Boolean,
            default: false,
        },
        isStakingAllowed: {
            type: Boolean,
            default: true,
        },
        isInternalTransferAllowed: {
            type: Boolean,
            default: false,
        },
        isAvailableForReward: {
            type: Boolean,
            default: false,
        },
        rank: {
            type: Number,
            default: 0,
        },
        airDorpLevel: {
            type: Number,
            default: 0,
        },
        stakingLevel: {
            type: Number,
            min: 1,
            default:1,
        },
        walletAddress: {
            type: String,
        },
        lastLogin: {
            type: Number,
        },
        otp: {
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

User.index({ email: 1, mobile: 1 }, { unique: true });

User.plugin(mongoosePaginate);
module.exports = mongoose.models.User || mongoose.model("User", User);
