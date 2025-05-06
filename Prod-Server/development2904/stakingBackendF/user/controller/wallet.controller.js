const config = require("../../config/config");
const Web3 = require("web3");
const axios = require("axios");
const web3 = new Web3(config.RPC_URL);
const bcrypt = require("bcrypt");
const UserModel = require("../../models/users.model");
const TransactionModel = require("../../models/transactions.model");
const { handleErrorResponse, CustomErrorHandler } = require("../../middleware/CustomErrorHandler");
const { calculateUserBalance } = require('../../services/balance.service');

module.exports.transactionList = async (request, response) => {
    try {
        const { user } = request.body;
        const { page, sizePerPage, transactionType, status, startDate, endDate } = request.query;

        const userData = await UserModel.findOne({
            _id: user._id,
            isDeleted: false,
        });
        if (!userData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        const options = {
            page: parseInt(page) || 1,
            limit: parseInt(sizePerPage) || 10,
            sort: { createdAt: -1 },
            populate: {
                path: "fromUser",
                select: "name referralCode email",
            },
        };

        const query = {
            user: userData._id,
            ...(transactionType && { transactionType }),
            ...(status && { status }),
        };

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        };

        const transactionList = await TransactionModel.paginate(query, options);

        if (!transactionList) {
            throw CustomErrorHandler.notFound("Transaction Not Found!");
        };

        return response.json({
            status: true,
            message: "Transactions List Two",
            data: transactionList,
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};

module.exports.getSingleTransactions = async (request, response) => {
    try {
        const { user } = request.body;
        const { id } = request.params;

        const userData = await UserModel.findOne({
            _id: user._id,
            isDeleted: false,
        });
        if (!userData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        const singleTransaction = await TransactionModel.findOne({
            _id: id,
            user: userData._id,
            isDeleted: false
        });
        if (!singleTransaction) throw CustomErrorHandler.notFound('Not found!');

        return response.json({
            status: true,
            message: "Transaction Details.",
            data: singleTransaction,
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};

module.exports.swapWallet = async (request, response) => {
    try {
        const { user, amount, password } = request.body;

        const userData = await UserModel.findOne({
            _id: user._id,
            isDeleted: false,
        }).select("+trxPassword");;
        if (!userData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        if (!userData.isTrxPassCreated) throw CustomErrorHandler.wrongCredentials("Please create Transaction Password!");

        const checkPassword = await bcrypt.compare(password, userData.trxPassword);
        if (!checkPassword) {
            throw CustomErrorHandler.wrongCredentials("Wrong Transaction Password!");
        }

        if(userData.BUSDBalance < amount){
            throw CustomErrorHandler.lowBalance("Low USDT Balance!");
        };

        //Debit
        await TransactionModel.create({
            user: userData._id,
            transactionType: "SWAP-BUSD-TO-TRADE",
            amount: -amount,
            balanceType: "BUSD",
            currentBalance: userData.BUSDBalance - amount,
            description: `${amount} USDT Converted to TRADE`
        });
        //Credit
        const insertTransaction = await TransactionModel.create({
            user: userData._id,
            transactionType: "SWAP-BUSD-TO-TRADE",
            amount: amount,
            balanceType: "TRADE",
            currentBalance: userData.BUSDBalance - amount,
            description: `${amount} USDT TRADE Received`
        });

        userData.BUSDBalance -= amount;
        userData.TRADEBalance += Number(amount);
        await userData.save();

        return response.json({
            status: true,
            message: `${amount} USDT Swaped to TRADE.`,
            data: insertTransaction,
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};

module.exports.convertReward = async (request, response) => {
    try {
        const { user } = request.body;

        const userData = await UserModel.findOne({
            _id: user._id,
            isDeleted: false,
        });
        if (!userData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        const convertAmount = userData.totalRewardBalance - userData.totalUnlockRewardBalnce;
        if(convertAmount <= 0) throw CustomErrorHandler.wrongCredentials("Nothing to Convert!");

        const convertRewardData = await TransactionModel.create({
            user: user._id,
            transactionType: "CONVERT-REWARD",
            amount: convertAmount,
            currentBalance: userData.BUSDBalance + convertAmount,
            description: `Converted Reward amount ${convertAmount}`
        });

        userData.BUSDBalance += convertAmount;
        userData.totalUnlockRewardBalnce += convertAmount;
        await userData.save();

        return response.json({
            status: true,
            message: "Reward Converted.",
            data: convertRewardData,
        });
    } catch (e) {
        console.log("Error While Converting Reward", e);
        handleErrorResponse(e, response);
    }
};

// Add this helper function at the top with other imports
const calculateLockEndDate = (createdAt, lockPeriod) => {
    const lockEndDate = new Date(createdAt);
    lockEndDate.setDate(lockEndDate.getDate() + lockPeriod);
    return lockEndDate;
};

const checkWithdrawalLockConditions = async (userId, amount) => {
    // Check minimum deposit requirement
    const totalDeposits = await TransactionModel.aggregate([
        {
            $match: {
                user: userId,
                transactionType: { $in: ["DEPOSIT", "BOND-IN"] },
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

    const totalDepositAmount = totalDeposits.length > 0 ? totalDeposits[0].total : 0;
    if (totalDepositAmount < 100) {
        throw CustomErrorHandler.unAuthorized("Minimum deposit of $100 required to make transfers/withdrawals");
    }

    // Check lock status for deposits
    const activeStakes = await TransactionModel.find({
        user: userId,
        transactionType: "BOND-IN",
        status: "COMPLETED",
        isDeleted: false,
        'planDetails.lockPeriod': { $exists: true }  // Only get stakes with lock period
    }).lean();  // Use lean() for better performance

    let totalStakedAmount = 0;
    let isLocked = false;
    let latestLockEndDate = null;
    const currentDate = new Date();

    // Process active stakes
    activeStakes.forEach(deposit => {
        if (!deposit.planDetails?.lockPeriod) return;  // Skip invalid entries
        
        const lockEndDate = calculateLockEndDate(deposit.createdAt, deposit.planDetails.lockPeriod);
        totalStakedAmount += deposit.amount;
        
        if (lockEndDate > currentDate) {
            isLocked = true;
            latestLockEndDate = !latestLockEndDate || lockEndDate > latestLockEndDate 
                ? lockEndDate 
                : latestLockEndDate;
        }
    });

    // Replace the calculateWithdrawableAmount call with calculateUserBalance
    const balanceData = await calculateUserBalance(userId);
    const withdrawableBalance = balanceData.withdrawableBalance;
    
    // if (isLocked && amount > withdrawableBalance) {
    //     throw CustomErrorHandler.unAuthorized(`Transfer/Withdrawal amount exceeds unlocked balance. Maximum allowed: ${withdrawableBalance.toFixed(2)} USDT`);
    // }

    return true;
};

// Modify internalTransfer to use the new check
module.exports.internalTransafer = async (request, response) => {
    try {
        const { user, referralCode, password, amount } = request.body;
        console.log('internalTransafer',amount);
        const userData = await UserModel.findOne({
            _id: user._id,
            isInternalTransferAllowed: true,
            isDeleted: false,
        }).select("+trxPassword");;
        if (!userData) throw CustomErrorHandler.unAuthorized("Access Denied!");
        
        // Add withdrawal lock check
        await checkWithdrawalLockConditions(userData._id, amount);

        const recepientUser = await UserModel.findOne({
            $or: [
                { referralCode: referralCode.toUpperCase() },
                { loginId: referralCode }
            ],
            isDeleted: false
        });
        if (!recepientUser) throw CustomErrorHandler.unAuthorized("Recepient Not Found! or Deleted!");

        if (userData.referralCode === recepientUser.referralCode) {
            throw CustomErrorHandler.wrongCredentials("Recepient Must be a Different User!");
        };

        if (userData.TRADEBalance < amount) {
            throw CustomErrorHandler.lowBalance("Low TRADE Balance!");
        };

        const checkPassword = await bcrypt.compare(password, userData.trxPassword);
        if (!checkPassword) throw CustomErrorHandler.wrongCredentials("Wrong Transaction Password!");

        // Get current TRADE balance from transactions
        const currentTradeBalance = await TransactionModel.aggregate([
            {
                $match: {
                    user: userData._id,
                    balanceType: "TRADE",
                    status: "COMPLETED",
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: null,
                    balance: { $sum: "$amount" }
                }
            }
        ]);

        const tradeBalance = currentTradeBalance.length > 0 ? currentTradeBalance[0].balance : 0;

        const transferData = await TransactionModel.create({
            amount: -amount,
            user: userData._id,
            fromUser: recepientUser._id,
            transactionType: "FUND-TRANSFER",
            balanceType: "TRADE",
            currentBalance: tradeBalance - amount,
            description: `${amount} USDT Send to user ${recepientUser.loginId}`
        });

        // Get recipient's current TRADE balance
        const recipientTradeBalance = await TransactionModel.aggregate([
            {
                $match: {
                    user: recepientUser._id,
                    balanceType: "TRADE",
                    status: "COMPLETED",
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: null,
                    balance: { $sum: "$amount" }
                }
            }
        ]);

        const recipientBalance = recipientTradeBalance.length > 0 ? recipientTradeBalance[0].balance : 0;

        await TransactionModel.create({
            amount: amount,
            fromUser: userData._id,
            user: recepientUser._id,
            balanceType: "TRADE",
            transactionType: "FUND-TRANSFER",
            currentBalance: recipientBalance + Number(amount),
            description: `${amount} USDT received from user ${userData.loginId}`
        });

        userData.TRADEBalance -= amount;
        await userData.save();

        recepientUser.TRADEBalance += Number(amount);
        await recepientUser.save();

        return response.json({
            status: true,
            message: `${amount} USDT TRADE Balance Send.`,
            data: transferData,
        });
    } catch (e) {
        console.log("Error While Internal Transfer", e);
        handleErrorResponse(e, response);
    }
};

module.exports.transferToTrade = async (request, response) => {
    try {
        const { user, amount, password } = request.body;

        const userData = await UserModel.findOne({
            _id: user._id,
            isDeleted: false,
        }).select("+trxPassword");
        if (!userData) throw CustomErrorHandler.unAuthorized("Access Denied!");
        if (!userData.isTrxPassCreated) throw CustomErrorHandler.wrongCredentials("Please create Transaction Password!");

        await checkWithdrawalLockConditions(userData._id, amount);

        const checkPassword = await bcrypt.compare(password, userData.trxPassword);
        if (!checkPassword) throw CustomErrorHandler.wrongCredentials("Wrong Transaction Password!");

        if (userData.BUSDBalance < amount) {
            throw CustomErrorHandler.lowBalance("Low USDT Balance!");
        }

        // Get current BUSD balance from transactions
        const currentBUSDBalance = await TransactionModel.aggregate([
            {
                $match: {
                    user: userData._id,
                    balanceType: "BUSD",
                    status: "COMPLETED",
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: null,
                    balance: { $sum: "$amount" }
                }
            }
        ]);

        const busdBalance = currentBUSDBalance.length > 0 ? currentBUSDBalance[0].balance : 0;

        // Get current TRADE balance
        const currentTradeBalance = await TransactionModel.aggregate([
            {
                $match: {
                    user: userData._id,
                    balanceType: "TRADE",
                    status: "COMPLETED",
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: null,
                    balance: { $sum: "$amount" }
                }
            }
        ]);

        const tradeBalance = currentTradeBalance.length > 0 ? currentTradeBalance[0].balance : 0;

        // Debit from main balance
        await TransactionModel.create({
            user: userData._id,
            transactionType: "MAIN-TO-TRADE",
            amount: -amount,
            balanceType: "BUSD",
            currentBalance: busdBalance - amount,
            description: `${amount} USDT transferred to Trade Wallet`
        });

        // Credit to trade balance
        const transferData = await TransactionModel.create({
            user: userData._id,
            transactionType: "MAIN-TO-TRADE",
            amount: amount,
            balanceType: "TRADE",
            currentBalance: tradeBalance + Number(amount),
            description: `${amount} USDT TRADE received from Main Wallet`
        });

        // Update user balances
        userData.BUSDBalance -= amount;
        userData.TRADEBalance += Number(amount);
        await userData.save();

        return response.json({
            status: true,
            message: `${amount} USDT transferred to Trade Wallet`,
            data: transferData,
        });
    } catch (e) {
        console.log("Error in transferToTrade:", e);
        handleErrorResponse(e, response);
    }
};

module.exports.tradeToMain = async (request, response) => {
    try {
        const { user, amount, password } = request.body;

        const userData = await UserModel.findOne({
            _id: user._id,
            isDeleted: false,
        }).select("+trxPassword");

        if (!userData) throw CustomErrorHandler.unAuthorized("Access Denied!");
        if (!userData.isTrxPassCreated) throw CustomErrorHandler.wrongCredentials("Please create Transaction Password!");

        const checkPassword = await bcrypt.compare(password, userData.trxPassword);
        if (!checkPassword) throw CustomErrorHandler.wrongCredentials("Wrong Transaction Password!");

        if (userData.TRADEBalance < amount) {
            throw CustomErrorHandler.lowBalance("Low TRADE Balance!");
        }

        // Debit from trade balance
        await TransactionModel.create({
            user: userData._id,
            transactionType: "TRADE-TO-MAIN",
            amount: -amount,
            balanceType: "TRADE",
            currentBalance: userData.TRADEBalance - amount,
            description: `${amount} USDT transferred to Main Wallet`
        });

        // Credit to main balance
        const transferData = await TransactionModel.create({
            user: userData._id,
            transactionType: "TRADE-TO-MAIN",
            amount: amount,
            balanceType: "BUSD",
            currentBalance: userData.BUSDBalance + amount,
            description: `${amount} USDT received from Trade Wallet`
        });

        // Update user balances
        userData.TRADEBalance -= amount;
        userData.BUSDBalance += Number(amount);
        await userData.save();

        return response.json({
            status: true,
            message: `${amount} USDT transferred to Main Wallet`,
            data: transferData,
        });
    } catch (e) {
        console.log("Error in tradeToMain:", e);
        handleErrorResponse(e, response);
    }
};

module.exports.withdrawUsdt = async (request, response) => {
    try {
        const { amount, chain, address, password, user, source } = request.body;
        
        const userData = await UserModel.findOne({
            _id: user._id,
            isWithdrawAllowed: true,
            isDeleted: false,
        }).select("+trxPassword");

        if (!userData) throw CustomErrorHandler.unAuthorized("Access Denied!, Create Transaction Password!");
        if (!userData.isTrxPassCreated) throw CustomErrorHandler.wrongCredentials("Please create Transaction Password!");

        // Use the shared withdrawal lock check function
        await checkWithdrawalLockConditions(userData._id, amount);

        // Rest of the withdrawal logic remains the same
        const checkPassword = await bcrypt.compare(password, userData.trxPassword);
        if (!checkPassword) {
            throw CustomErrorHandler.wrongCredentials("Wrong Transaction Password!");
        }

        if (amount < Number(config.MIN_WITHDRAW) || amount > Number(config.MAX_WITHDRAW)) {
            throw CustomErrorHandler.wrongCredentials(`Minimum ${config.MIN_WITHDRAW} USDT Allowed.`);
        };

        const lastWithdrawal = await TransactionModel.findOne({
            user: user._id,
            transactionType: "WITHDRAW",
            status: "COMPLETED",
            isDeleted: false,
        }).sort({ createdAt: -1 });


        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        // if (lastWithdrawal && lastWithdrawal.createdAt > twentyFourHoursAgo) {
        //     throw CustomErrorHandler.unAuthorized("You Are Allowed To Make One Withdrawal in Every 24 Hours!");
        // };


        if (userData.BUSDBalance < amount) {
            throw CustomErrorHandler.lowBalance("Low USDT Balance!");
        };

        // Use provided address or fallback to user's wallet address
        const withdrawalAddress = address || userData.walletAddress;
        if (!withdrawalAddress) {
            throw CustomErrorHandler.notFound("Withdrawal Address Not Found!");
        }
        // console.log("withdrawalAddress chain", chain);
        let transactionData;
        // In the withdrawUsdt function, modify the BEP20 section:
        if (chain === 'BEP20') {
            // console.log("Starting BEP20 withdrawal process");
            // const contract = new web3.eth.Contract(config.ABI, config.USDT_CONTRACT_ADDRESS);
            
            // const amountInWei = web3.utils.toWei((amount*95/100).toString(), 'ether');
            
            // Create pending transaction first
            transactionData = await TransactionModel.create({
                user: userData._id,
                amount: -amount,
                transactionType: "WITHDRAW",
                withdrawalSource: source,  // Add withdrawal source
                chain: chain,
                withdrawAddress: address,
                currentBalance: userData.BUSDBalance - amount,
                status: "PENDING",
                description: `${amount} USDT withdrawal from ${source} on ${chain}-${address}`,
                address: address
            });
        
            // Update user balance
            userData.BUSDBalance -= amount;
            userData.totalWithdrawalBalance += amount;
            await userData.save();
        
            return response.json({
                status: true,
                message: 'Withdrawal request submitted successfully. Pending approval.',
                data: transactionData,
            });
        }
         else if (chain === 'TRC20') {
            transactionData = await TransactionModel.create({
                user: userData._id,
                amount: -amount, 
                transactionType: "WITHDRAW",
                withdrawalSource: source,  // Add withdrawal source
                chain: chain,
                withdrawAddress: withdrawalAddress,
                currentBalance: userData.BUSDBalance - amount,
                status: "PENDING",
                description: `${amount} USDT withdrawal on ${chain}-${address}`
            });
        }

        userData.BUSDBalance -= amount;
        userData.totalWithdrawalBalance += amount;
        await userData.save();

        return response.json({
            status: true,
            message: chain === 'BEP20' ? `${amount} USDT Sent.` : 'Withdrawal request submitted successfully.',
            data: transactionData,
        });
    } catch (e) {
        console.log("Detailed Error in Withdraw:", {
            message: e.message,
            stack: e.stack,
            type: e.constructor.name
        });
        handleErrorResponse(e, response);
    }
};

module.exports.createTransactionPassword = async (request, response) => {
    try {
        const { user, password, cnfTxnPassword } = request.body;

        const userData = await UserModel.findOne({
            _id: user._id,
            isDeleted: false,
        }).select("+trxPassword");
        if (!userData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        if (!userData.isWithdrawAllowed) {
            throw CustomErrorHandler.unAuthorized("Withdrawals are currently not allowed for your account!");
        }

        if (userData.trxPassword){
            throw CustomErrorHandler.alreadyExist("Already Created Transaction Password!");
        }; 

        if (password !== cnfTxnPassword) {
            throw CustomErrorHandler.wrongCredentials("Confirm Password Not Match!");
        };

        const passwordSalt = await bcrypt.genSalt(Number(config.SALT_ROUND));
        const passwordHash = await bcrypt.hash(password, passwordSalt);

        userData.trxPassword = passwordHash;
        userData.isTrxPassCreated = true;
        await userData.save();

        return response.json({
            status: true,
            message: "Transaction Password Created.",
            data: userData,
        });
    } catch (e) {
        console.log("Error while Create Transaction password", e);
        handleErrorResponse(e, response);
    }
};

module.exports.changeTransactionPassword = async (request, response) => {
    try {
        const { user, oldPassword, newPassword, confirmPassword } = request.body;

        const userData = await UserModel.findOne({
            _id: user._id,
            isDeleted: false
        }).select("+trxPassword");
        if (!userData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        const checkPassword = await bcrypt.compare(
            oldPassword,
            userData.trxPassword
        );
        if (!checkPassword) throw CustomErrorHandler.wrongCredentials("Wrong Previous Password!");

        if (newPassword !== confirmPassword) {
            throw CustomErrorHandler.wrongCredentials("Confirm Password Not Match!");
        };
        if (newPassword === oldPassword) {
            throw CustomErrorHandler.wrongCredentials("Old and New Password SHould not be same!");
        };

        const passwordSalt = await bcrypt.genSalt(config.SALT_ROUND);
        const passwordHash = await bcrypt.hash(newPassword, passwordSalt);

        userData.trxPassword = passwordHash;
        await userData.save();

        return response.json({
            status: true,
            message: "Transaction Password Changed.",
            data: null,
        });
    } catch (e) {
        console.log("Error while Changing Transaction password", e);
        handleErrorResponse(e, response);
    }
};

module.exports.updateWalletAddress = async (request, response) => {
    try {
        const { user, address } = request.body;

        const userData = await UserModel.findOne({
            _id: user._id,
            isDeleted: false,
        });
        if (!userData) {
            throw CustomErrorHandler.unAuthorized("Access Denied!");
        };

        if (!web3.utils.isAddress(address)) {
            throw CustomErrorHandler.wrongCredentials("Wrong Address!");
        };

        const checkAddress = await UserModel.findOne({
            walletAddress: address,
        });
        if (checkAddress) throw CustomErrorHandler.alreadyExist("Exists Address!");

        userData.walletAddress = address;
        userData.isWalletAdded = true;
        await userData.save();

        return response.json({
            status: true,
            message: "Wallet address Added.",
            data: userData,
        });
    } catch (e) {
        console.log("Error while Updating Wallet Address", e);
        handleErrorResponse(e, response);
    }
};

module.exports.getWithdrawalLockStatus = async (request, response) => {
    try {
        const { user } = request.body;

        const userData = await UserModel.findOne({
            _id: user._id,
            isDeleted: false,
        });

        // Get bonded/staked amounts
        const bondedTransactions = await TransactionModel.find({
            user: userData._id,
            transactionType: "BOND-IN",
            status: "COMPLETED",
            isDeleted: false
        }).sort({ createdAt: -1 });

        // Process bonded transactions for lock status
        const activePlans = [];
        let latestLockEndDate = null;
        let totalLockedAmount = 0;

         bondedTransactions.forEach(bond => {
             if (bond.planDetails && bond.planDetails.lockPeriod) {
                 const depositDate = new Date(bond.createdAt);
                 const lockEndDate = new Date(depositDate);
                 lockEndDate.setDate(lockEndDate.getDate() + bond.planDetails.lockPeriod);
                 const isLocked = lockEndDate > new Date();

                 if (isLocked) {
                     totalLockedAmount += bond.amount;
                 }

                 activePlans.push({
                     planName: bond.planDetails.planName || 'Standard Plan',
                     depositAmount: bond.amount,
                     depositDate: bond.createdAt,
                     lockPeriod: `${bond.planDetails.lockPeriod} days`,
                     dailyRate: bond.planDetails.dailyRate,
                     expiryDate: lockEndDate,
                     status: isLocked ? 'Locked' : 'Unlocked'
                 });

                 if (isLocked && (!latestLockEndDate || lockEndDate > latestLockEndDate)) {
                     latestLockEndDate = lockEndDate;
                 }
             }
         });

        const balanceData = await calculateUserBalance(userData._id);
        
        return response.json({
            status: true,
            balanceBreakdown: {
                totalBalance: balanceData.BUSDBalance || 0,
                regularDeposits: balanceData.components.deposits,
                bondedAmount: balanceData.components.staked || 0,
                lockedAmount: balanceData.totalStakedBalance,
                withdrawableAmount: balanceData.withdrawableBalance,  // Use the calculated value from balanceData
                totalWithdrawn: balanceData.components.withdrawn,
                totalTransferred: balanceData.components.transferred,
                referralIncome: balanceData.totalReferralRewardBalance,
                bonusAmount: balanceData.totalBonusBalance,
                totalStakedBalance: balanceData.totalStakedBalance,
                totalTeamTurnover: balanceData.totalTeamTurnover,
                tradeToMain: balanceData.components.tradeToMain
            },
            withdrawals:{
                totalWithdrawn: balanceData.components.withdrawn.total,
                busd: balanceData.components.withdrawn.busd,
                referral: balanceData.components.withdrawn.referral,
                bonus: balanceData.components.withdrawn.bonus,
            },
            lockStatus: {
                isLocked: latestLockEndDate ? latestLockEndDate > new Date() : false,
                lockedUntil: latestLockEndDate ? latestLockEndDate.toISOString() : null
            },
            balances: {
                referral: balanceData.components.balances.referral || 0,
                bonus: balanceData.components.balances.bonus || 0
            },
            activePlans: activePlans
        });
    } catch (error) {
        console.log("Error in getWithdrawalLockStatus:", error);
        handleErrorResponse(error, response);
    }
};