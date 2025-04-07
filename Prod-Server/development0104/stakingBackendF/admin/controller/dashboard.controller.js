const UserModel = require("../../models/users.model");
const TransactionModel = require("../../models/transactions.model");
const { handleErrorResponse, CustomErrorHandler } = require("../../middleware/CustomErrorHandler")
const { calculateUserBalance } = require('../../services/balance.service');

module.exports.dashboardData = async (request, response) => {
    try {
        const { user } = request.body;

        const adminData = await UserModel.findOne({
            _id: user._id,
            role: "ADMIN",
            isDeleted: false
        });
        if (!adminData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        const pendingDepositsTxns = await TransactionModel.aggregate([
            {
                $match: {
                    status: "PENDING",
                    transactionType: { $in: ["DEPOSIT", "BOND-IN"] },
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: null,
                    pendingDeposits: { $sum: "$amount" }
                }
            }
        ]);

        const pendingWithdrawTxns = await TransactionModel.aggregate([
            {
                $match: {
                    status: "PENDING",
                    transactionType: "WITHDRAW",
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: null,
                    pendingWithdraws: { $sum: "$amount" }
                }
            }
        ]);

         

        // Get all transaction-based totals
        const transactionTotals = await TransactionModel.aggregate([
            {
                $match: {
                    status: "COMPLETED",
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: "$transactionType",
                    total: { $sum: "$amount" }
                }
            }
        ]);

        const walletBalances = await TransactionModel.aggregate([
            {
                $match: {
                    status: "COMPLETED",
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: {
                        balanceType: "$balanceType",
                        transactionType: "$transactionType",
                        withdrawalSource: "$withdrawalSource"
                    },
                    total: { $sum: "$amount" }
                }
            }
        ]);

        
        // Get withdrawals by source
        const withdrawalsBySource = await TransactionModel.aggregate([
            {
                $match: {
                    status: "COMPLETED",
                    transactionType: "WITHDRAW",
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: "$withdrawalSource",
                    total: { $sum: { $abs: "$amount" } }
                }
            }
        ]);
        // Get all users for total calculation
        const allUsers = await UserModel.find({ isDeleted: false });
        let totalBalances = {
            BUSDBalance: 0,
            withdrawableBalance: 0,
            totalReferralRewardBalance: 0,
            totalBonusBalance: 0,
            totalStakedBalance: 0,
            totalTeamTurnover: 0,
            components: {
                deposits: 0,
                staked: 0,
                referral: 0,
                bonus: 0,
                tradeToMain: 0,
                mainToTrade: 0,
                withdrawn: {
                    total: 0,
                    busd: 0,
                    referral: 0,
                    bonus: 0
                },
                transferred: 0
            }
        };

        // Calculate totals for all users
        for (const user of allUsers) {
            const userBalance = await calculateUserBalance(user._id);
            totalBalances.BUSDBalance += Number(userBalance.BUSDBalance);
            totalBalances.withdrawableBalance += Number(userBalance.withdrawableBalance);
            totalBalances.totalReferralRewardBalance += Number(userBalance.totalReferralRewardBalance);
            totalBalances.totalBonusBalance += Number(userBalance.totalBonusBalance);
            totalBalances.totalStakedBalance += Number(userBalance.totalStakedBalance);
            totalBalances.totalTeamTurnover += Number(userBalance.totalTeamTurnover);
            
            // Add components
            totalBalances.components.deposits += Number(userBalance.components.deposits);
            totalBalances.components.staked += Number(userBalance.components.staked);
            totalBalances.components.referral += Number(userBalance.components.referral);
            totalBalances.components.bonus += Number(userBalance.components.bonus);
            totalBalances.components.tradeToMain += Number(userBalance.components.tradeToMain);
            totalBalances.components.mainToTrade += Number(userBalance.components.mainToTrade);
            totalBalances.components.withdrawn.total += Number(userBalance.components.withdrawn.total);
            totalBalances.components.withdrawn.busd += Number(userBalance.components.withdrawn.busd);
            totalBalances.components.withdrawn.referral += Number(userBalance.components.withdrawn.referral);
            totalBalances.components.withdrawn.bonus += Number(userBalance.components.withdrawn.bonus);
            totalBalances.components.transferred += Number(userBalance.components.transferred);
        }

        const dashboardData = {
            // Current balances
            totalBUSDBalance: Number(totalBalances.BUSDBalance.toFixed(4)),
            totalTRADEBalance: Number(totalBalances.totalStakedBalance.toFixed(4)),
            totalDeposits: Number(totalBalances.components.deposits.toFixed(4)),
            
            // Staking related
            totalStakedBalance: Number(totalBalances.totalStakedBalance.toFixed(4)),
            totalStakingRewardBalance: Number((totalBalances.components.staked - totalBalances.totalStakedBalance).toFixed(4)),
            
            // Withdrawals and transfers
            totalWithdrawalBalance: Number(totalBalances.components.withdrawn.total.toFixed(4)),
            totalInternalTransferBalance: Number(totalBalances.components.transferred.toFixed(4)),
            
            // Rewards and bonuses
            totalReferralRewardBalance: Number(totalBalances.totalReferralRewardBalance.toFixed(4)),
            totalBonusBalance: Number(totalBalances.totalBonusBalance.toFixed(4)),
            
            // Pending transactions (keep existing)
            totalPendingDeposits: pendingDepositsTxns[0]?.pendingDeposits || 0,
            totalPendingWithdraws: Math.abs(pendingWithdrawTxns[0]?.pendingWithdraws || 0),
            
            // Additional metrics
            totalTeamTurnover: Number(totalBalances.totalTeamTurnover.toFixed(4)),
            totalMainToTrade: Number(totalBalances.components.mainToTrade.toFixed(4)),
            totalTradeToMain: Number(totalBalances.components.tradeToMain.toFixed(4))
        };
        // console.log(dashboardData);
        return response.status(200).json({
            status: true,
            message: "Dashboard Data....",
            data: dashboardData
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};