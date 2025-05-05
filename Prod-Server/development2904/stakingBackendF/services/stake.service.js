const TransactionModel = require("../models/transactions.model");
const UserModel = require("../models/users.model");
const PlansModel = require("../models/plans.model");
const BalanceService = require("./balance.service");

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
        
        // Fetch plans from database instead of config
        const plans = await PlansModel.find({ isActive: true }).lean();

        const numericPlanId = Number(planId);
        const configuredPlan = plans.find(plan => plan.id === numericPlanId);

        if (!configuredPlan) {
            throw new Error(`Invalid investment plan. Plan ID ${planId} not found`);
        }

        // Use rate from database
        const rateDifference = Math.abs(configuredPlan.rate - dailyRate);
        if (rateDifference > 0.0001) {
            throw new Error("Invalid plan rate detected");
        }

        if (configuredPlan.name !== planName) {
            throw new Error("Invalid plan name");
        }

        // Return validated plan rate to ensure correct rate is used
        return configuredPlan.rate;
    }

    static async createStake(userData, depositData) {
        const validatedRate = await this.validatePlanDetails(depositData);
        const { amount, planId, planName, lockPeriod, transactionHash, network, fromDeposit, balanceType, isBonusStake } = depositData;
        const totalReturn = Number((amount * validatedRate * lockPeriod).toFixed(4));
        // console.log('transactionHash',transactionHash);
        // console.log('isBonusStake',isBonusStake);
        // Create signup bonus transaction if applicable
        if (isBonusStake) {
            await TransactionModel.create({
                user: userData._id,
                amount: 10,
                transactionType: "BOND-IN",
                balanceType: "SIGNUP-BONUS",
                currentBalance: -10,
                description: `Signup Bonus Stake - ${planName}`,
                planDetails: {
                    planId,
                    planName,
                    dailyRate: validatedRate,
                    lockPeriod: Number(lockPeriod),
                    originalLockPeriod: Number(lockPeriod),
                    totalReturn
                },
                txHash: `${transactionHash} - ${planName}`,
                chain: network,
                status: "PENDING",
                isStaked: true,
                fromDeposit: fromDeposit
            });
        }

        //if balanceType is referral create transaction for referral stake
        if (balanceType === 'referrals') {
            await TransactionModel.create({
                user: userData._id,
                amount: amount,
                transactionType: "BOND-IN",
                balanceType: "REFER-INCOME",
                currentBalance: -amount,
                description: `Referral Stake - ${planName}`,
                planDetails: {
                    planId,
                    planName,
                    dailyRate: validatedRate,
                    lockPeriod: Number(lockPeriod),
                    originalLockPeriod: Number(lockPeriod),
                    totalReturn 
                },
                txHash: `${transactionHash} - ${planName}`,
                chain: network,
                status: "PENDING",
                isStaked: true,
                fromDeposit: fromDeposit
            })
        }

        //create transaction for bond-in of RETURN-INTEREST
        if (balanceType === 'returnInterest') {
            await TransactionModel.create({
                user: userData._id,
                amount: amount,
                transactionType: "BOND-IN",
                balanceType: "RETURN-INTEREST",
                currentBalance: -amount,
                description: `Return Interest Stake - ${planName}`,
                planDetails: {
                    planId,
                    planName,
                    dailyRate: validatedRate,
                    lockPeriod: Number(lockPeriod),
                    originalLockPeriod: Number(lockPeriod),
                    totalReturn 
                },
                txHash: `${transactionHash} - ${planName}`,
                chain: network,
                status: "PENDING",
                isStaked: true,
                fromDeposit: fromDeposit
            })
        }
        // Create regular staking transaction
        if (!balanceType || balanceType === 'stake' || balanceType === 'deposits') {
            await TransactionModel.create({
                user: userData._id,
                amount: amount,
                transactionType: "BOND-IN",
                balanceType: fromDeposit ? "DEPOSIT" : "STAKE",
                currentBalance: -amount,
                description: `Staking Plan ${planName}`,
                planDetails: {
                    planId,
                    planName,
                    dailyRate: validatedRate,
                    lockPeriod: Number(lockPeriod),
                    originalLockPeriod: Number(lockPeriod),
                    totalReturn
                },
                txHash: `${transactionHash} - ${planName}`,
                chain: network,
                status: "PENDING",
                isStaked: true,
                fromDeposit: fromDeposit
            });
        }
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