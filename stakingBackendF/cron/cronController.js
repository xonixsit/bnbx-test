const UserModel = require("../models/users.model");
const TransactionModel = require("../models/transactions.model");
const delegatePlan = require("../config/delegate.json");

function calculateRewardAmount(amount){
    // Convert amount to positive
    amount = Math.abs(amount);
    if(amount >= 50 && amount < 1000){
        // monthly 6% reward
        return (amount*6/100)/20;
    } else if(amount >= 1000 && amount < 3000){
        // monthly 8% reward
        return (amount*8/100)/20;
    } else if(amount >= 3000 && amount < 5000){
        // monthly 10% reward
        return (amount*10/100)/20;
    } else if(amount >= 5000) {
       // monthly 12% reward
       return (amount*12/100)/20; 
    }
}

//ROI Per day distribution;
module.exports.stakingRewardDistribution = async () => {
    try {
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const twentyHoursAgo = new Date();
        twentyHoursAgo.setHours(twentyHoursAgo.getHours() - 20);

        const transactionList = await TransactionModel.find({
            transactionType: "BOND-IN",
            status: "COMPLETED",
            $and: [
                { createdAt: { $lt: twentyFourHoursAgo } },
                // { updatedAt: { $lt: twentyHoursAgo } }
            ],
            isDeleted: false,
        }).exec();

        for (const transaction of transactionList) {
            const userData = await UserModel.findOne({
                _id: transaction.user,
                isDeleted: false,
                isAvailableForReward: true,
            });

            if (userData) {
                const rewardAmount = calculateRewardAmount(transaction.amount);
                await TransactionModel.create({
                    user: userData._id,
                    transactionType: "BOND-REWARD",
                    amount: rewardAmount,
                    stakingId: transaction._id,
                    currentBalance: userData.BUSDBalance,
                    description: `Bonding reward for amount ${rewardAmount}`
                });

                userData.totalStakingRewardBalance += Number(rewardAmount);
                userData.totalRewardBalance += Number(rewardAmount);
                await userData.save();

                // update Last reward date
                await TransactionModel.findOneAndUpdate(
                    {_id: transaction._id},
                    {},
                    {new: true}
                );

                if(userData.fromUser){
                    await delegateDistribution(userData.fromUser, userData.loginId, rewardAmount, 0);
                }
            }
        } console.log("Reward distribution completed")
    } catch (error) {
        console.log("Error While Bonding Reward Distribution:", error.message);
    }
};

function calculateRankDelegateReward(rank){
    if(rank == 1){
        return 1.5;
    } else if(rank == 2){
        return 2;
    } else if(rank == 3){
        return 2.5;
    } else if(rank == 4){
        return 3;
    } else return false;
}

//Generation Dirstribution
async function delegateDistribution(userId, fromUserLoginId, amount, level, stakingId) {

    try {
        const userData = await UserModel.findOne({
            _id: userId,
        });
        if(level>=20 || !userData) return true;
       
        const directReferral = await UserModel.countDocuments({
            fromUser: userId,
            totalStakedBalance: { $gt: 0 },
            isDeleted: false
        })

        const levelPlan = delegatePlan[level];
        if(directReferral<levelPlan.minUser) return true;
        
        // Skip for terminated user
        if(!userData.isDeleted && userData.isAvailableForReward){ //  If the user has been deleted then do not add any ROI to his/her account
            const levelRoiAmount = (amount * levelPlan.percentage) / 100;
            const calculateRank = calculateRankDelegateReward(userData.rank);
            const rankExtraPercentage = levelRoiAmount * calculateRank;

            const message1 = `Delegated reward from user ${fromUserLoginId} amount ${levelRoiAmount} and rankAmount ${rankExtraPercentage-levelRoiAmount}`;
            const message2 = `Delegated reward from user ${fromUserLoginId} amount ${levelRoiAmount}`;

            await TransactionModel.create({
                user: userId,
                // fromUser: fromUser,
                amount: calculateRank?rankExtraPercentage:levelRoiAmount,
                transactionType: "DELEGATED-REWARD",
                stakingId: stakingId,
                currentBalance: userData.BUSDBalance,
                description: calculateRank?message1:message2
            });
            
            userData.totalDelegateRewardBalance += calculateRank?Number(rankExtraPercentage):Number(levelRoiAmount);
            userData.totalRewardBalance += calculateRank?Number(rankExtraPercentage):Number(levelRoiAmount);
            await userData.save();
        }

        if(userData.fromUser){
            await delegateDistribution(userData.fromUser, fromUserLoginId, amount, ++level, stakingId);
        }

        return true;
    } catch (error) {
        console.log("Error:", error);
        return false;
    }
};

module.exports.deleteStaking = async () => {
    try {
        const userList = await UserModel.find({
            totalRewardBalance: { $gt: 0 }
        });

        for (const user of userList) {

            const stakingData = await TransactionModel.findOne({
                user: user._id,
                type: "BOND-IN",
                isDeleted: false,
            });

            if(stakingData){
                let earningX = 2;
                if(user.rank >= 1) earningX = 3;
                if ((user.removedStakedBalance + (stakingData.stakingPrice * 
                        stakingData.amount)) * earningX <= user.totalReward) {
                    await TransactionModel.findOneAndUpdate(
                        { _id: stakingData._id },
                        {
                            $set: { isDeleted: true, status: 0}
                        },
                        { new: true }
                    );

                    const userData = await UserModel.findOne({
                        _id: stakingData.user,
                        // isDeleted: false,
                    });

                    userData.removedStakedBalance += (stakingData.stakingPrice * stakingData.amount);
                    
                    const stakingLevelDetails = StakingLevel[userData.stakingLevel-1];
                    if(userData.totalReward >= stakingLevelDetails.totalReward){
                        userData.stakingLevel ++;
                    };
                    userData.save();
                    console.log(userData)
                }
            }

        };

        // return true;
    } catch (error) {
        console.error("Error in threeXstopReward:", error.message);
        // throw error;
    }
};

function calculateRankReward(rank){
    if(rank == 1){
        return 50;
    } else if(rank == 2){
        return 200;
    } else if(rank == 3){
        return 500;
    } else if(rank == 4){
        return 1000;
    } else return false;
}

// Weekly distribution
module.exports.RankRewardDistribution = async () => {
    try {
        const userList = await UserModel.find({
            rank: { $gte: 1 },
            isAvailableForReward: true,
            isDeleted: false
        }); if(!userList) return false;

        for(const user of userList){
            const rankRewardAmount = calculateRankReward(user.rank);
            if(rankRewardAmount){
                await TransactionModel.create({
                    user: user._id,
                    transactionType: "RANK-REWARD",
                    amount: rankRewardAmount,
                    currentBalance: user.BUSDBalance,
                    description: `Rank reward for Rank ${user.rank}`
                });

                await UserModel.findOneAndUpdate(
                    { id: user._id },
                    {
                        $inc: {
                            totalRankBonusBalance: rankRewardAmount,
                            totalRewardBalance: rankRewardAmount
                        }
                    },
                    { new: true }
                );
            }
        }
    } catch (error) {
        console.log("Error:", error.message);
        return true;
    }
};