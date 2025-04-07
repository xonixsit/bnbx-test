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
                    balanceType: "TRADE",        
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
                    balanceType: "BUSD",  // Only count the BUSD (debit) entries
                    status: "COMPLETED",
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }  // Remove abs() to keep negative values
                }
            }
        ]);

        // Get trade to main transactions
        const tradeToMainTransactions = await TransactionModel.aggregate([
            {
                $match: {
                    user: userId,
                    transactionType: "TRADE-TO-MAIN",
                    balanceType: "BUSD",  // Only count the BUSD (credit) entries
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
        // Get withdrawals by source
        const busdWithdrawals = await TransactionModel.aggregate([
            {
                $match: {
                    user: userId,
                    transactionType: "WITHDRAW",
                    withdrawalSource: "DEPOSIT", 
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

        const referralWithdrawals = await TransactionModel.aggregate([
            {
                $match: {
                    user: userId,
                    transactionType: "WITHDRAW",
                    withdrawalSource: "REFER-INCOME",  // Changed from source to withdrawalSource
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

        const bonusWithdrawals = await TransactionModel.aggregate([
            {
                $match: {
                    user: userId,
                    transactionType: "WITHDRAW",
                    withdrawalSource: "SIGNUP-BONUS",  // Changed from source to withdrawalSource
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
        console.log('depositTransactions',depositTransactions);
        // Calculate totals with precise financial calculations
        const totalDeposits = Number((depositTransactions.length > 0 ? depositTransactions[0].total : 0).toFixed(2));
        const totalReferral = Number((referralRewards.length > 0 ? referralRewards[0].total : 0).toFixed(2));
        const totalBonus = Number((bonusBalance.length > 0 ? bonusBalance[0].total : 0).toFixed(2));
        const totalStaked = Number((stakedBalance.length > 0 ? stakedBalance[0].total : 0).toFixed(2));
        const totalWithdrawn = Number((withdrawalTransactions.length > 0 ? withdrawalTransactions[0].total : 0).toFixed(2));
        const mainToTrade = Number((mainToTradeTransactions.length > 0 ? Math.abs(mainToTradeTransactions[0].total) : 0).toFixed(2));
        const tradeToMain = Number((tradeToMainTransactions.length > 0 ? tradeToMainTransactions[0].total : 0).toFixed(2));
        
        // Update total transferred to include both fund transfers and main-to-trade transfers
        const totalTransferred = Number((
            (transferTransactions.length > 0 ? transferTransactions[0].total : 0) +
            mainToTrade
        ).toFixed(2));

        // Get received transfers
        const receivedTransfers = await TransactionModel.aggregate([
            {
                $match: {
                    user: userId,  // User is the recipient
                    transactionType: "FUND-TRANSFER",
                    balanceType: "BUSD",
                    status: "COMPLETED",
                    isDeleted: false,
                    fromUser: { $exists: true }  // Ensure there's a sender
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);

        // Add this query before the balance calculation
        const returnInterestTransactions = await TransactionModel.aggregate([
            {
                $match: {
                    user: userId,
                    transactionType: "RETURN-INTEREST",
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

        const unlockedStakeTransactions = await TransactionModel.aggregate([
            {
                $match: {
                    user: userId,
                    transactionType: "STAKE-UNLOCKED",
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

        console.log('totalDeposits',totalDeposits);
        // Calculate BUSD Balance
        const BUSDBalance = Number((
            totalDeposits + 
            totalReferral + 
            totalBonus + 
            tradeToMain + 
            
            (receivedTransfers.length > 0 ? receivedTransfers[0].total : 0) +  // Add received transfers
            (returnInterestTransactions.length > 0 ? returnInterestTransactions[0].total : 0) +  // Add return interest
            (unlockedStakeTransactions.length > 0 ? unlockedStakeTransactions[0].total : 0) -  // Add unlocked stakes
            mainToTrade - 
            totalWithdrawn
        ).toFixed(2));
        console.log("totalDeposits:", totalDeposits);
        console.log("totalReferral:", totalReferral);
        console.log("totalBonus:", totalBonus);
        console.log("tradeToMain:", tradeToMain);
        console.log("BUSDBalance:", BUSDBalance);
        console.log("receivedTransfers:", receivedTransfers);
        console.log("returnInterestTransactions:", returnInterestTransactions);
        // Calculate withdrawable amount (deposits + referral + bonus + tradeToMain - withdrawn - totalTransferred)
        const withdrawableAmount = Number((
            totalDeposits + 
            totalReferral + 
            totalBonus + 
            tradeToMain +
            (unlockedStakeTransactions.length > 0 ? unlockedStakeTransactions[0].total : 0) -  // Add unlocked stakes 
            totalWithdrawn - 
            totalTransferred
        ).toFixed(2));

        return {
            BUSDBalance,
            withdrawableBalance: Math.max(0, withdrawableAmount),
            totalReferralRewardBalance: totalReferral,
            totalBonusBalance: totalBonus,
            totalStakedBalance: totalStaked,
            totalTeamTurnover: Number((teamTurnover.length > 0 ? teamTurnover[0].totalTurnover : 0).toFixed(2)),
            components: {
                deposits: totalDeposits,
                staked: totalStaked,
                referral: totalReferral,
                bonus: totalBonus,
                tradeToMain,
                mainToTrade,
                withdrawn: {
                    total: totalWithdrawn,
                    busd: Number((busdWithdrawals.length > 0 ? busdWithdrawals[0].total : 0).toFixed(2)),
                    referral: Number((referralWithdrawals.length > 0 ? referralWithdrawals[0].total : 0).toFixed(2)),
                    bonus: Number((bonusWithdrawals.length > 0 ? bonusWithdrawals[0].total : 0).toFixed(2))
                },
                balances: {
                    referral: Number((totalReferral - (referralWithdrawals.length > 0 ? referralWithdrawals[0].total : 0)).toFixed(2)),
                    bonus: Number((totalBonus - (bonusWithdrawals.length > 0 ? bonusWithdrawals[0].total : 0)).toFixed(2))
                },
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