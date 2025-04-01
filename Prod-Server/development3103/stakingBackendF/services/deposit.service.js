const TransactionModel = require("../models/transactions.model");
const UserModel = require("../models/users.model");
const investmentPlans = require("../config/plans.config");

class DepositService {
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

    static validatePlanDetails(planData) {
        const { planId, planName, dailyRate, amount } = planData;
        
        const configuredPlan = investmentPlans.find(plan => plan.id === planId);
        if (!configuredPlan) {
            throw new Error("Invalid investment plan");
        }

        // Strict rate validation with small tolerance for floating-point precision
        const rateDifference = Math.abs(configuredPlan.rate - dailyRate);
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

    static async createDeposit(userData, depositData) {
        const validatedRate = this.validatePlanDetails(depositData);
        const { amount, planId, planName, lockPeriod, transactionHash } = depositData;
        console.log('depositData',depositData);
        const totalReturn = amount * validatedRate * lockPeriod;

        const transaction = await TransactionModel.create({
            user: userData._id,
            amount,
            transactionType: "DEPOSIT",
            currentBalance: userData.BUSDBalance,
            description: "Please Wait for approval.",
            status: "PENDING",
            txHash: transactionHash,  // Added txHash field
            planDetails: {
                planId,
                planName,
                dailyRate: validatedRate,
                lockPeriod,
                totalReturn
            }
        });
        return transaction;
    }
}

module.exports = DepositService;