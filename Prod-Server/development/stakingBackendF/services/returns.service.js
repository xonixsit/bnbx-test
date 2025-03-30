const TransactionModel = require("../models/transactions.model");
const UserModel = require("../models/users.model");
const LogModel = require("../models/logs.model");

class ReturnsService {
    static async processUserDailyReturns() {
        try {
            await LogModel.create({
                type: 'CRON',
                message: 'Daily Returns Processing Started'
            });

            // For testing: Change to 1 minute ago instead of 24 hours
            // const oneMinuteAgo = new Date();
            // oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

            const oneDayAgo = new Date();
            oneDayAgo.setHours(oneDayAgo.getHours() - 24);

            // Get all active deposits that haven't received interest in the last 24 hours
            const activeDeposits = await TransactionModel.find({
                transactionType: "DEPOSIT",
                status: "COMPLETED",
                'planDetails.lockPeriod': { $gt: 0 },  // Only process if lock period remaining
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

            // Log for monitoring
            console.log(`Last interest cutoff time: ${oneDayAgo.toISOString()}`);
            console.log(`Processing returns for ${activeDeposits.length} active deposits`);
            console.log(`\nTotal active deposits found: ${activeDeposits.length}`);
            console.log('\nProcessing returns for users:');
            console.log('----------------------------------------');

            let successCount = 0;
            let totalInterestPaid = 0;  // Track total interest across all transactions

            for (const deposit of activeDeposits) {
                try {
                    const user = await UserModel.findById(deposit.user);
                    if (!user) {
                        console.log(`❌ Skipped: Deposit ${deposit._id} - User not found`);
                        continue;
                    }

                    // Validate and calculate daily return
                    if (!deposit.planDetails || typeof deposit.planDetails.dailyRate !== 'number') {
                        console.log(`❌ Skipped: Deposit ${deposit._id} - Invalid plan details`);
                        continue;
                    }                    


                    // Round and accumulate total interest
                    const dailyReturn = Number((deposit.amount * deposit.planDetails.dailyRate).toFixed(4));
                    totalInterestPaid = Number((totalInterestPaid + dailyReturn).toFixed(4));
                    const newBalance = Number((user.BUSDBalance + dailyReturn).toFixed(4));

                    if (isNaN(dailyReturn)) {
                        console.log(`❌ Skipped: Deposit ${deposit._id} - Invalid daily return calculation`);
                        continue;
                    }

                    // Create return transaction with correct values
                    await TransactionModel.create({
                        user: user._id,
                        amount: totalInterestPaid,  // Just the interest amount
                        transactionType: "RETURN-INTEREST",
                        currentBalance: newBalance,  //  balance + Interest
                        description: `Daily return for deposit ${user.loginId} -- ${deposit.planDetails.planName}`,
                        status: "COMPLETED",
                        relatedDeposit: deposit._id
                    });

                    // Update user balance with correct amount
                    await UserModel.findByIdAndUpdate(user._id, {
                        $set: { BUSDBalance: newBalance }  // Set exact new balance
                    });
                    await TransactionModel.findByIdAndUpdate(deposit._id, {
                        $inc: { 'planDetails.lockPeriod': -1 },
                        $set: { lastInterestPaid: new Date() }
                    });

                    // After processing each user's interest
                    await LogModel.create({
                        type: 'INTEREST',
                        message: `Interest credited to ${user.loginId || user._id}`,
                        details: {
                            userId: user._id,
                            loginId: user.loginId,
                            depositId: deposit._id,
                            planName: deposit.planDetails.planName,
                            amount: totalInterestPaid,
                            remainingLockDays: deposit.planDetails.lockPeriod - 1,
                            currentBalance: user.BUSDBalance + totalInterestPaid,
                            timestamp: new Date()
                        }
                    });

                    console.log(`✅ Credited: ${user.loginId || user._id}`);
                    console.log(`   Plan: ${deposit.planDetails.planName}`);
                    console.log(`   Amount: ${totalInterestPaid.toFixed(2)} USDT`);
                    console.log(`   Remaining Lock Days: ${deposit.planDetails.lockPeriod - 1}`);
                    console.log('----------------------------------------');
                    successCount++;
                } catch (error) {
                    console.error(`Error processing deposit ${deposit._id}:`, error);
                    await LogModel.create({
                        type: 'ERROR',
                        message: `Error processing deposit ${deposit._id}`,
                        details: error.message
                    });
                }
            }

            console.log('\n=== Summary ===');
            console.log(`✅ Successfully processed: ${successCount} deposits`);
            console.log(`💰 Total interest paid: ${totalInterestPaid.toFixed(2)} USDT`);
            console.log('=== Daily Returns Processing Completed ===\n');
            await LogModel.create({
                type: 'CRON',
                message: 'Daily Returns Processing Completed',
                details: {
                    successCount,
                    totalInterestPaid
                }
            });

        } catch (error) {
            await LogModel.create({
                type: 'ERROR',
                message: 'Error processing daily returns',
                details: error.message
            });
            console.error('❌ Error processing daily returns:', error);
        }
    }
}

module.exports = ReturnsService;