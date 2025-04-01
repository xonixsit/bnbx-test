const TransactionModel = require("../models/transactions.model");
const UserModel = require("../models/users.model");
const LogModel = require("../models/logs.model");
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ 
            filename: '/root/stakingBackendF/logs/returns-service.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        new winston.transports.Console()
    ]
});

class ReturnsService {
    static async processUserDailyReturns() {
        try {
            logger.info('Daily Returns Processing Started');
            await LogModel.create({
                type: 'CRON',
                message: 'Daily Returns Processing Started'
            });

            await this.processDailyInterest();
            // Remove this line as unlocking is now handled in processDailyInterest
            // await this.processStakeUnlocking();

            logger.info('Daily Returns Processing Completed');
            await LogModel.create({
                type: 'CRON',
                message: 'Daily Returns Processing Completed'
            });

        } catch (error) {
            logger.error('Error processing daily returns:', { error: error.message, stack: error.stack });
            await LogModel.create({
                type: 'ERROR',
                message: 'Error processing daily returns',
                details: error.message
            });
        }
    }

    static async processDailyInterest() {
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);

        const activeDeposits = await TransactionModel.find({
            transactionType: "BOND-IN",
            status: "COMPLETED",
            'planDetails.lockPeriod': { $gt: 0 },
            $or: [
                { lastInterestPaid: { $exists: false } },
                {
                    $and: [
                        { lastInterestPaid: { $lt: oneDayAgo } },
                        { lastInterestPaid: { $ne: null } }
                    ]
                }
            ]
        }).populate('user');

        logger.info(`Processing returns for ${activeDeposits.length} active deposits`);

        let successCount = 0;
        let totalInterestPaid = 0;
        let unlockedCount = 0;

        for (const deposit of activeDeposits) {
            try {
                const user = deposit.user;
                if (!user || !deposit.planDetails?.dailyRate) {
                    logger.warn(`Skipped: Deposit ${deposit._id} - Invalid data`);
                    continue;
                }

                const dailyReturn = Number((deposit.amount * deposit.planDetails.dailyRate).toFixed(4));
                const newBalance = Number((user.BUSDBalance + dailyReturn).toFixed(4));

                await TransactionModel.create({
                    user: user._id,
                    amount: dailyReturn,
                    transactionType: "RETURN-INTEREST",
                    currentBalance: newBalance,
                    description: `Daily return for deposit ${user.loginId} -- ${deposit.planDetails.planName}`,
                    status: "COMPLETED",
                    relatedDeposit: deposit._id
                });

                await UserModel.findByIdAndUpdate(user._id, {
                    $set: { BUSDBalance: newBalance }
                });

                await TransactionModel.findByIdAndUpdate(deposit._id, {
                    $inc: { 'planDetails.lockPeriod': -1 },
                    $set: { lastInterestPaid: new Date() }
                });

                // Check if lock period has ended and process unlocking
                const updatedDeposit = await TransactionModel.findById(deposit._id);
                if (updatedDeposit.planDetails.lockPeriod <= 0 && !updatedDeposit.isUnlocked) {
                    logger.info(`Attempting to unlock stake: Plan=${updatedDeposit.planDetails.planName}, Original Lock Period=${updatedDeposit.planDetails.originalLockPeriod}`);
                    await this.unlockStake(updatedDeposit);
                    unlockedCount++;
                }

                totalInterestPaid += dailyReturn;
                successCount++;
                
                logger.info(`Credited: ${user.loginId} - ${dailyReturn.toFixed(2)} USDT`);
                await LogModel.create({
                    type: 'TRANSACTION',
                    message: `Daily return credited`,
                    details: `User: ${user.loginId}, Amount: ${dailyReturn.toFixed(2)} USDT, Plan: ${deposit.planDetails.planName}`
                });
            } catch (error) {
                logger.error(`Error processing deposit ${deposit._id}:`, { error: error.message, stack: error.stack });
                await LogModel.create({
                    type: 'ERROR',
                    message: `Error processing deposit ${deposit._id}`,
                    details: error.message
                });
            }
        }

        logger.info(`Processed: ${successCount} deposits, Total Interest: ${totalInterestPaid.toFixed(2)} USDT, Unlocked Stakes: ${unlockedCount}`);
    }

    static async unlockStake(stake) {
        try {
            // Ensure user is populated and verify lock period
            const populatedStake = await TransactionModel.findById(stake._id).populate('user');
            const user = populatedStake.user;
            
            // Additional verification of lock period
            if (populatedStake.planDetails.lockPeriod > 0) {
                logger.warn(`Attempted to unlock stake ${stake._id} with remaining lock period: ${populatedStake.planDetails.lockPeriod} days`);
                return;
            }

            if (!user) {
                throw new Error(`User not found for stake ${stake._id}`);
            }

            // Log stake details before unlocking
            logger.info(`Unlocking stake: Plan=${populatedStake.planDetails.planName}, LockPeriod=${populatedStake.planDetails.lockPeriod}, Amount=${populatedStake.amount}`);

            // Rest of the unlocking logic
            const newBalance = user.BUSDBalance + stake.amount;

            await TransactionModel.create({
                user: user._id,
                amount: stake.amount,
                transactionType: "STAKE-UNLOCKED",
                currentBalance: newBalance,
                description: `Stake unlocked for plan ${stake.planDetails.planName}`,
                status: "COMPLETED",
                relatedDeposit: stake._id
            });

            await UserModel.findByIdAndUpdate(user._id, {
                $set: { BUSDBalance: newBalance }
            });

            await TransactionModel.findByIdAndUpdate(stake._id, {
                $set: { isUnlocked: true }
            });

            logger.info(`Unlocked: ${user.loginId} - ${stake.amount} USDT`);
                await LogModel.create({
                    type: 'TRANSACTION',
                    message: `Stake unlocked`,
                    details: `User: ${user.loginId}, Amount: ${stake.amount} USDT, Plan: ${stake.planDetails.planName}`
                });
            } catch (error) {
                logger.error(`Error unlocking stake ${stake._id}:`, { error: error.message, stack: error.stack });
                await LogModel.create({
                    type: 'ERROR',
                    message: `Error unlocking stake ${stake._id}`,
                    details: error.message
                });
        }
    }}
module.exports = ReturnsService;