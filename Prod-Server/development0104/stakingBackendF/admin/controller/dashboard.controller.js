const UserModel = require("../../models/users.model");
const TransactionModel = require("../../models/transactions.model");
const { handleErrorResponse, CustomErrorHandler } = require("../../middleware/CustomErrorHandler")

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

        // Combine the results
        // Get user balances (these should stay from UserModel)
        const userBalances = await UserModel.aggregate([
            {
                $group: {
                    _id: null,
                    totalBUSDBalance: { $sum: "$BUSDBalance" },
                    totalTRADEBalance: { $sum: "$TRADEBalance" }
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

        const balanceTotals = walletBalances.reduce((acc, curr) => {
            const { balanceType, transactionType, withdrawalSource } = curr._id;
            
            if (!acc[balanceType]) {
                acc[balanceType] = 0;
            }

            // Handle withdrawals based on their source
            if (transactionType === 'WITHDRAW' && withdrawalSource) {
                // Don't subtract withdrawals here as they're handled per source
                return acc;
            }

            acc[balanceType] += curr.total;
            return acc;
        }, {});


        const totals = transactionTotals.reduce((acc, curr) => {
            acc[curr._id] = curr.total;
            return acc;
        }, {});

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

        const withdrawalTotals = withdrawalsBySource.reduce((acc, curr) => {
            acc[curr._id] = curr.total;
            return acc;
        }, {});

        console.log(withdrawalTotals);
        const dashboardData = {
            // Current balances from UserModel with all withdrawal sources subtracted
            totalBUSDBalance: (balanceTotals['BUSD'] || 0) - 
                (Object.values(withdrawalTotals).reduce((sum, val) => sum + val, 0) || 0),
            totalTRADEBalance: (balanceTotals['TRADE'] || 0),
            totalDeposits: totals['DEPOSIT'] || 0,
            // Transaction-based totals
            totalStakedBalance: (totals['BOND-IN'] || 0) - Math.abs(totals['UNSTAKE'] || 0),
            totalRemovedStakedBalance: Math.abs(totals['UNSTAKE'] || 0),
            totalWithdrawalBalance: Math.abs(totals['WITHDRAW'] || 0),
            totalInternalTransferBalance: totals['INTERNAL-TRANSFER'] || 0,
            totalUnlockRewardBalnce: totals['UNLOCK-REWARD'] || 0,
            // Update referral income to subtract withdrawals
            totalReferralRewardBalance: (totals['REFER-INCOME'] || 0) - (withdrawalTotals['REFER-INCOME'] || 0),
            totalStakingRewardBalance: totals['STAKING-REWARD'] || 0,
            totalRankBonusBalance: totals['RANK-BONUS'] || 0,
            totalRewardBalance: (totals['REFER-INCOME'] || 0) + (totals['STAKING-REWARD'] || 0) + (totals['RANK-BONUS'] || 0),
            totalBonusBalance: (
                (totals['SIGNUP-BONUS'] || 0) + 
                (totals['LEVEL-AIR-DROP'] || 0) + 
                (totals['RANK-UPGRADE-BONUS'] || 0) + 
                (totals['BOND-REWARD'] || 0)
            ),
            
            // Pending transactions
            totalPendingDeposits: pendingDepositsTxns[0]?.pendingDeposits || 0,
            totalPendingWithdraws: Math.abs(pendingWithdrawTxns[0]?.pendingWithdraws || 0),
            
            // Calculated fields
            pendingReward: (totals['STAKING-REWARD'] || 0) - (totals['UNLOCK-REWARD'] || 0)
        };
        // console.log(dashboardData);
        return response.status(200).json({
            status: true,
            message: "Dashboard Data.",
            data: dashboardData
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};