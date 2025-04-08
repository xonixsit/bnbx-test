const TransactionModel = require("../models/transactions.model");
const UserModel = require("../models/users.model");
const getInvestmentPlans = require("../config/plans.config");

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

    static async validatePlanDetails(planData) {
        const { planId, planName, dailyRate, amount } = planData;
        
        const plans = await getInvestmentPlans();
        const configuredPlan = plans.find(plan => plan.id === planId);
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

        return Number(configuredPlan.rate); // Return as number
    }

    static async createDeposit(userData, depositData) {
        const validatedRate = await this.validatePlanDetails(depositData);
        const { amount, planId, planName, lockPeriod, transactionHash } = depositData;
        
        const totalReturn = Number((amount * validatedRate * lockPeriod).toFixed(4));

        const transaction = await TransactionModel.create({
            user: userData._id,
            amount: Number(amount),
            transactionType: "DEPOSIT",
            currentBalance: Number(userData.BUSDBalance),
            description: "Please Wait for approval.",
            status: "PENDING",
            txHash: transactionHash,
            planDetails: {
                planId,
                planName,
                dailyRate: validatedRate, // Already a number from validatePlanDetails
                lockPeriod: Number(lockPeriod),
                totalReturn
            }
        });
        return transaction;
    }
}

module.exports = DepositService;