const config = require("../../config/config");
const UserModel = require("../../models/users.model");
const teamDistribution = require("../../utils/teamDistribution");
const TransactionModel = require("../../models/transactions.model");
const { handleErrorResponse, CustomErrorHandler } = require("../../middleware/CustomErrorHandler");

module.exports.stakeBalance = async (request, response) => {
    try {
        const { user, amount } = request.body;

        const userData = await UserModel.findOne({
            _id: user._id,
            isDeleted: false,
        });

        if (!userData) throw CustomErrorHandler.unAuthorized("Access Denied!");
        
        if (!userData.isStakingAllowed) {
            throw CustomErrorHandler.notAllowed("Bond Not allowed!");
        };

        if (userData.TRADEBalance < amount) {
            throw CustomErrorHandler.lowBalance("Low Trade Balance!");
        };

        if (Number(config.MIN_AMOUNT) > amount) {
            throw CustomErrorHandler.wrongCredentials("Low Bonding Amount!");
        };

        // USDT
        const newBondData = await TransactionModel.create({
            amount: -amount,
            user: userData._id,
            transactionType: "BOND-IN",
            stakingTime: new Date().getTime(),
            balanceType: "TRADE",
            currentBalance: userData.BUSDBalance,
            description: "Bond For your self"
        });
    
        const updateData = {
            availableForReward: true,
            isWithdrawAllowed: true,
            isInternalTransferAllowed: true,
            isReferralAllowed: true,
            isAvailableForReward: true,
        };

        const incData = {
            TRADEBalance: -amount,
            totalStakedBalance: amount,
        };
        
        // update current user Balance
        await UserModel.findOneAndUpdate(
            {
                _id: userData._id,
            },
            {
                $inc: incData,
                $set: updateData,
            },
            {
                new: true,
            },
        );

        // update Turnover
        if(userData.fromUser){
            await teamDistribution.teamTurnoverDistribution(userData.fromUser, amount);
            console.log("TeamTurnover Distributed.");

            await teamDistribution.upgradeRank(userData.fromUser);
            console.log("Rank Upgrade");
        };

        return response.json({
            status: true,
            message: "Bonding Completed.",
            data: newBondData,
        });
    } catch (e) {
        console.log("Error While Bonding!", e)
        handleErrorResponse(e, response);
    }
};