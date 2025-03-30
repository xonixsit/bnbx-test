const TransactionModel = require("../models/transactions.model");
const UserModel = require("../models/users.model");
const mongoose = require('mongoose');

// Add getAllTeamMembers function
const getAllTeamMembers = async (userId, members = new Set()) => {
    const directReferrals = await UserModel.find({ 
        fromUser: userId, 
        isDeleted: false 
    });
    
    for (const referral of directReferrals) {
        const refId = referral._id.toString();
        if (!members.has(refId)) {
            members.add(refId);
            await getAllTeamMembers(referral._id, members);
        }
    }

    return Array.from(members).map(id => new mongoose.Types.ObjectId(id));
};

const calculateUserBalance = async (userId) => {
    try {
        // Get team members and calculate turnover
        const teamMembers = await getAllTeamMembers(userId);
        teamMembers.push(userId); // Add current user's ID

        const teamTurnover = await TransactionModel.aggregate([
            {
                $match: {
                    transactionType: { $in: ["DEPOSIT", "BOND-IN"] },
                    status: "COMPLETED",
                    isDeleted: false,
                    user: { $in: teamMembers }
                }
            },
            {
                $group: {
                    _id: null,
                    totalTurnover: { $sum: "$amount" }
                }
            }
        ]);

        // Get regular deposits
        const depositTransactions = await TransactionModel.aggregate([
            {
                $match: {
                    user: userId,
                    transactionType: "DEPOSIT",
                    status: "COMPLETED",
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);

        // Get referral rewards
        const referralRewards = await TransactionModel.aggregate([
            {
                $match: {
                    user: userId,
                    transactionType: "REFER-INCOME",
                    status: "COMPLETED",
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);

        // Get bonus balance
        const bonusBalance = await TransactionModel.aggregate([
            {
                $match: {
                    user: userId,
                    status: "COMPLETED",
                    isDeleted: false,
                    $or: [
                        { 
                            transactionType: { 
                                $in: ["SIGNUP-BONUS", "LEVEL-AIR-DROP", "RANK-UPGRADE-BONUS", "BOND-REWARD"] 
                            },
                            amount: { $gt: 0 } 
                        }
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);

        // Get staked balance
        const stakedBalance = await TransactionModel.aggregate([
            {
                $match: {
                    user: userId,
                    transactionType: "BOND-IN",
                    status: "COMPLETED"
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);

        // Get withdrawals
        const withdrawalTransactions = await TransactionModel.aggregate([
            {
                $match: {
                    user: userId,
                    transactionType: "WITHDRAW",
                    status: "COMPLETED",
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: { $abs: "$amount" } }
                }
            }
        ]);

        // Get transfers
        const transferTransactions = await TransactionModel.aggregate([
            {
                $match: {
                    user: userId,
                    transactionType: "FUND-TRANSFER",
                    status: "COMPLETED",
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: { $abs: "$amount" } }
                }
            }
        ]);

        // Get main to trade transactions
        const mainToTradeTransactions = await TransactionModel.aggregate([
            {
                $match: {
                    user: userId,
                    transactionType: "MAIN-TO-TRADE",
                    status: "COMPLETED",
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: { $abs: "$amount" } }
                }
            }
        ]);

        // Get trade to main transactions
        const tradeToMainTransactions = await TransactionModel.aggregate([
            {
                $match: {
                    user: userId,
                    transactionType: "TRADE-TO-MAIN",
                    balanceType: "BUSD",  // Only count the BUSD entries
                    status: "COMPLETED",
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);
        // Calculate totals
        const totalDeposits = depositTransactions.length > 0 ? depositTransactions[0].total : 0;
        const totalReferral = referralRewards.length > 0 ? referralRewards[0].total : 0;
        const totalBonus = bonusBalance.length > 0 ? bonusBalance[0].total : 0;
        const totalStaked = stakedBalance.length > 0 ? stakedBalance[0].total : 0;
        const totalWithdrawn = withdrawalTransactions.length > 0 ? withdrawalTransactions[0].total : 0;
        const totalTransferred = transferTransactions.length > 0 ? transferTransactions[0].total : 0;
        const mainToTrade = mainToTradeTransactions.length > 0 ? mainToTradeTransactions[0].total : 0;
        const tradeToMain = tradeToMainTransactions.length > 0 ? tradeToMainTransactions[0].total : 0;
        // console.log("tradetomain", tradeToMain, "maintotrade", mainToTrade)
        // Calculate withdrawable amount
        const withdrawableAmount = Number((
            Number(totalDeposits || 0) + 
            Number(totalReferral || 0) + 
            Number(totalBonus || 0) + 
            Number(tradeToMain || 0) - 
            Number(mainToTrade || 0) - 
            Number(totalWithdrawn || 0) - 
            Number(totalTransferred || 0)
        ).toFixed(2));

        return {
            BUSDBalance: Number((
                Number(totalDeposits || 0) + 
                Number(totalStaked || 0) + 
                Number(totalReferral || 0) + 
                Number(totalBonus || 0) + 
                Number(tradeToMain || 0) - 
                Number(mainToTrade || 0) - 
                Number(totalWithdrawn || 0) - 
                Number(totalTransferred || 0)
            ).toFixed(2)),
            withdrawableBalance: Math.max(0, withdrawableAmount),
            totalReferralRewardBalance: totalReferral,
            totalBonusBalance: totalBonus,
            totalStakedBalance: totalStaked,
            totalTeamTurnover: teamTurnover.length > 0 ? teamTurnover[0].totalTurnover : 0,
            components: {
                deposits: totalDeposits,
                staked: totalStaked,
                referral: totalReferral,
                bonus: totalBonus,
                tradeToMain: tradeToMain,
                mainToTrade: mainToTrade,
                withdrawn: totalWithdrawn,
                transferred: totalTransferred
            }
        };
    } catch (error) {
        console.error("Error in calculateUserBalance:", error);
        throw error;
    }
};

module.exports = {
    calculateUserBalance
};