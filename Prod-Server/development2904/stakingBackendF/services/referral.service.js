const UserModel = require("../models/users.model");
const TransactionModel = require("../models/transactions.model");

class ReferralService {
    static async processReferralBonus(userData, depositAmount) {
        try {
            if (!userData.referredBy) return;

            const referrer = await UserModel.findOne({
                referralCode: userData.referredBy,
                isDeleted: false
            });

            if (!referrer) return;

            const referralBonus = depositAmount * 0.05; // 5% referral bonus
            console.log('referralBouns',referralBouns);
            await TransactionModel.create({
                user: referrer._id,
                amount: referralBonus,
                transactionType: "REFERRAL-BONUS",
                balanceType: "BUSD",
                currentBalance: referrer.BUSDBalance + referralBonus,
                description: `Referral bonus from ${userData.loginId}'s deposit`,
                status: "COMPLETED"
            });

            referrer.BUSDBalance += referralBonus;
            await referrer.save();
        } catch (error) {
            console.error("Error processing referral bonus:", error);
        }
    }
}

module.exports = ReferralService;