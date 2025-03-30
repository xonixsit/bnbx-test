const UserModel = require("../models/users.model");
const TransactionModel = require("../models/transactions.model");

module.exports.rewardEarning = async (userId, reward) => {
    const userData = await UserModel.findOne({
        _id: userId,
        availableForReward: true,
        isDeleted: false
    }); if(!userData) return false;

    if(userData.rank >= 1){ // 3X
        if(userData.totalRewardBalance >= userData.totalStakedBalance * 3){
            const data = {
                message: "reaches 3x limit",
                rewardAmount: 0,
                status: false,
            };

            await TransactionModel.create({
                user: userData._id,
                transactoinType: "BURN",
                balanceType: "USDT",
                amount: (userData.totalRewardBalance - userData.totalStakedBalance * 3)
            });
            userData.totalRewardBalance -= (userData.totalRewardBalance - userData.totalStakedBalance * 3);
            await userData.save();

            return data;
        } else if((reward + userData.totalRewardBalance) > (userData.totalStakedBalance * 3)) {
            const partialRewardAmount = (userData.totalStakedBalance * 3) - userData.totalRewardBalance;
            const data = {
                message: "add partial reward",
                rewardAmount: partialRewardAmount,
                status: true,
            }
            return data;
        } else {
            const data = {
                message: "adding full reward",
                rewardAmount: reward,
                status: true,
            }
            return data;
        }
    } else { // 2X
        if(userData.totalRewardBalance >= userData.totalStakedBalance * 2){
            const data = {
                message: "reaches 2x limit",
                rewardAmount: 0,
                status: false,
            }

            await TransactionModel.create({
                user: userData._id,
                transactoinType: "BURN",
                balanceType: "USDT",
                amount: (userData.totalRewardBalance - userData.totalStakedBalance * 2)
            });
            userData.totalRewardBalance -= (userData.totalRewardBalance - userData.totalStakedBalance * 2);
            await userData.save();

            return data;
        } else if((reward + userData.totalRewardBalance) > (userData.totalStakedBalance * 2)) {
            const partialRewardAmount = (userData.totalStakedBalance * 2) - userData.totalRewardBalance;
            const data = {
                message: "add partial reward",
                rewardAmount: partialRewardAmount,
                status: true,
            }
            return data;
        } else {
            const data = {
                message: "adding full reward",
                rewardAmount: reward,
                status: true,
            }
            return data;
        }
    }
};