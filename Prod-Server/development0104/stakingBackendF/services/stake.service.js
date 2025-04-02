const TransactionModel = require("../models/transactions.model");
const UserModel = require("../models/users.model");
const getInvestmentPlans = require("../config/plans.config");

class StakeService {
    static async validateUser(userId) {
        const user = await UserModel.findOne({
            _id: userId,
            isDeleted: false,
        });
        if (!user) {
            throw new Error("User not found or deleted!");
        }
        return user;
    }

    static async checkExistingTransaction(transactionHash) {
        const existingTx = await TransactionModel.findOne({ 
            transactionHash,
            isDeleted: false 
        });
        
        if (existingTx?.status === 'REJECTED') {
            throw new Error("This transaction has been rejected. Please contact support.");
        }
        return existingTx;
    }

    static async validatePlanDetails(planData) {
        const { planId, planName, dailyRate, amount } = planData;
        
        const plans = await getInvestmentPlans();
        const configuredPlan = plans.find(plan => plan.id === planId);
        console.log("configuredPlan",configuredPlan);
        if (!configuredPlan) {
            throw new Error("Invalid investment plan");
        }

        // Strict rate validation with small tolerance for floating-point precision
        const rateDifference = Math.abs(configuredPlan.rate - dailyRate);
        console.log("rateDifference",rateDifference);
        if (rateDifference > 0.0001) {
            throw new Error("Invalid plan rate detected");
        }

        if (configuredPlan.name !== planName) {
            throw new Error("Invalid plan name");
        }

        if (amount < configuredPlan.min || amount > configuredPlan.max) {
            throw new Error(`Amount must be between ${configuredPlan.min} and ${configuredPlan.max}`);
        }

        // Return validated plan rate to ensure correct rate is used
        return configuredPlan.rate;
    }

    static async createStake(userData, depositData) {
        const validatedRate = await this.validatePlanDetails(depositData);
        const { amount, planId, planName, lockPeriod, transactionHash, network } = depositData;
        
        const totalReturn = Number((amount * validatedRate * lockPeriod).toFixed(4));
        
        const transaction = await TransactionModel.create({
            user: userData._id,
            amount: Number(amount),
            transactionType: "BOND-IN",
            balanceType: "TRADE",
            currentBalance: Number(userData.BUSDBalance),
            description: "Please Wait for approval.",
            status: "PENDING",
            txHash: transactionHash,
            chain: network,
            planDetails: {
                planId,
                planName,
                dailyRate: validatedRate,
                lockPeriod: Number(lockPeriod),
                originalLockPeriod: Number(lockPeriod),
                totalReturn
            }
        });
        return transaction;
    }

    static async createDeposit(userData, depositData) {
        
        const { amount, transactionHash } = depositData;

        const transaction = await TransactionModel.create({
            user: userData._id,
            amount,
            transactionType: "DEPOSIT",
            balanceType: "BUSD",
            currentBalance: userData.BUSDBalance,
            description: "Please Wait for approval.",
            status: "PENDING",
            txHash: transactionHash,  // Added txHash field
        });
        return transaction;
    }
}

module.exports = StakeService;