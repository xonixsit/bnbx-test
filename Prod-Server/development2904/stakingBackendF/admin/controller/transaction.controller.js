const UserModel = require("../../models/users.model");
const TransactionModel = require("../../models/transactions.model");
const { handleErrorResponse, CustomErrorHandler } = require("../../middleware/CustomErrorHandler");

module.exports.transactionList = async (request, response) => {
    try {
        const { user } = request.body;
        const { page = 1, sizePerPage = 10, status, userId, transactionType,
            startDate, endDate, greaterThan, lessThan } = request.query;

        const adminData = await UserModel.findOne({ 
            _id: user._id,
            role: "ADMIN",
            isDeleted: false
        });
        if (!adminData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        if (userId) {
            const checkUser = await UserModel.findById(userId);
            if (!checkUser) {
                throw CustomErrorHandler.wrongCredentials("Enter Valid UserId!");
            }
        }

        const query = {
            ...(userId && { user: userId }),
            ...(status && { status }),
            ...(transactionType && { transactionType }),
            ...(greaterThan && lessThan && { amount: { $gt: greaterThan, $lt: lessThan } }),
            isDeleted: false  // Add this to ensure we only get active transactions
        };

        const options = {
            page,
            limit: 100,
            sort: { createdAt: -1 },
            populate: [
                {
                    path: "user",
                    select: "name email profileImage createdAt referralCode loginId",
                },
                {
                    path: "fromUser",
                    select: "name email profileImage createdAt referralCode loginId",
                },
            ],
            select: "user fromUser amount status createdAt transactionType chain balanceType _id txHash description address", // Added address to select
        };

        const transactionList = await TransactionModel.paginate(query, options);

        // Sort docs array by createdAt in descending order
        transactionList.docs.sort((a, b) => b.createdAt - a.createdAt);

        // Transform docs to include txHash and address for PENDING DEPOSIT transactions
        transactionList.docs = transactionList.docs.map(doc => {
            const transformed = doc.toObject ? doc.toObject() : doc;
            return {
                ...transformed,
                txHash: ((transformed.transactionType === "DEPOSIT" || transformed.transactionType === "BOND-IN") && 
                    (transformed.status === "PENDING" || transformed.status === "COMPLETED")) 
                    ? transformed.txHash || null 
                    : undefined,
                address: ((transformed.transactionType === "WITHDRAW" || transformed.transactionType === "DEPOSIT" || transformed.transactionType === "BOND-IN") && 
                    (transformed.status === "PENDING" || transformed.status === "COMPLETED"))
                    ? transformed.chain || null
                    : undefined,
            };
        });

        return response.json({
            status: true,
            message: "Transaction List.",
            data: transactionList
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};

module.exports.transactionById = async (request, response) => {
    try {
        const { user } = request.body;
        const { id } = request.params;
        
        const adminData = await UserModel.findOne({ 
            _id: user._id,
            role: "ADMIN",
            isDeleted: false
        });
        if (!adminData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        const transactionData = await TransactionModel.findById(id)
            .populate('user', 'name email profileImage createdAt referralCode');
        if (!transactionData) throw CustomErrorHandler.notFound("Not Found!");

        return response.json({
            status: true,
            message: "Transaction Details.",
            data: transactionData,
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};

module.exports.verifyDepositeUSDT = async (request, response, next) => {
    try {
        const { user, transactionId, status } = request.body;

        const adminData = await UserModel.findOne({ 
            _id: user._id,
            role: "ADMIN",
            isDeleted: false
        });
        if (!adminData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        const transactionData = await TransactionModel.findOne({
            _id: transactionId,
            status: "PENDING",
            isDeleted: false
        });
        if (!transactionData) throw CustomErrorHandler.notFound("Transaction id Not Found!");

        const userData = await UserModel.findOne({
            _id: transactionData.user,
            isDeleted: false
        }).populate('fromUser');

        // console.log("User Data:", userData);
        if (!userData) throw CustomErrorHandler.notFound("User Not Found!");

        if(status === "COMPLETED") {
            // Update transaction status
            transactionData.status = "COMPLETED";
            transactionData.description = `Verified by admin.`;
            await transactionData.save();
    
            // Update user's balance
            userData.BUSDBalance += Number(transactionData.amount);
            await userData.save();

            // Process referral commissions
            if (userData.fromUser) {
                let currentUser = userData.fromUser;
                const depositAmount = Number(transactionData.amount);
                // console.log('currentUser:',currentUser);
                // Process up to 12 levels of referrals based on the chart
                for (let level = 1; level <= 12; level++) {
                    if (!currentUser) break;
                    // Get commission percentage based on user's turnover level
                    let commissionRate = await calculateCommissionRate(currentUser, level);
                    if (commissionRate > 0) {
                        const commission = (depositAmount * commissionRate) / 100;
                            // Update user's total referral reward balance
                        currentUser.totalReferralRewardBalance = (currentUser.totalReferralRewardBalance || 0) + commission;
                        // console.log('currentUser.totalReferralRewardBalance:',currentUser);
                        // Create commission transaction
                        await TransactionModel.create({
                            user: currentUser._id,
                            amount: commission,
                            transactionType: "REFER-INCOME",
                            balanceType: "BUSD",
                            status: "COMPLETED",
                            description: `Level ${level} referral commission from ${userData.loginId}'s deposit`,
                            currentBalance: currentUser.BUSDBalance + commission
                        });

                        // Update referrer's balance
                        currentUser.BUSDBalance += commission;
                        // console.log('commission:',commission)
                        await currentUser.save();
                    }

                    // Move to next level referrer
                    currentUser = await UserModel.findOne({ _id: currentUser.fromUser });
                }
            }
    
            return response.json({
                status: true,
                message: `USDT Deposit Verified.`,
                data: '',
            });
        } else {
            transactionData.status = "REJECTED";
            transactionData.description = "Rejected by admin.";
            await transactionData.save();
console.log(transactionData)
            // Refund the amount if deposit is rejected
            if (transactionData.transactionType === "DEPOSIT") {
                userData.BUSDBalance += Math.abs(transactionData.amount);
                await userData.save();
            }

            return response.json({
                status: true,
                message: `USDT Deposit Rejected.`,
                data: '',
            });
        }
    } catch (e) {
        handleErrorResponse(e, response);
    }
};

// Helper function to calculate commission rate based on user's level and turnover
async function calculateCommissionRate(user, level) {
    const turnover = await calculateUserTurnover(user._id);
    
    const commissionRates = {
        '0': [7,2,1,1,1,1,0,0,0,0,0,0],     // LEARNER (0) - 13%
        '25000': [8,3,1,1,1,1,0,0,0,0,0,0],  // ADVANCE (25K) - 15%
        '50000': [8,3,2,1,1,1,1,0,0,0,0,0],  // MASTER (50K) - 17%
        '100000': [9,3,2,1,1,1,1,0,0,0,0,0], // SUPERIOR (100K) - 18%
        '250000': [9,4,3,2,1,1,1,1,0,0,0,0], // LEADER (250K) - 22%
        '500000': [10,5,3,2,1,1,1,1,0,0,0,0], // SENIOR LEADER (500K) - 24%
        '1000000': [10,5,3,2,1,1,1,1,1,0,0,0], // TOP LEADER (1M) - 25%
        '2000000': [11,5,3,2,1,1,1,1,1,1,0,0], // MANAGER (2M) - 27%
        '5000000': [11,5,4,3,2,1,1,1,1,1,1,0], // SENIOR MANAGER (5M) - 31%
        '10000000': [12,5,4,3,2,2,1,1,1,1,0,0], // TOP MANAGER (10M) - 32%
        '15000000': [13,6,4,3,2,2,1,1,1,1,0,1], // DIRECTOR (15M) - 35%
        '25000000': [14,6,4,3,2,2,1,1,1,1,1,1], // TOP DIRECTOR (25M) - 37%
        '50000000': [15,7,5,3,2,2,2,2,1,1,1,1]  // PRIME DIRECTOR (50M) - 42%
    };

    // Find appropriate commission rate based on turnover
    let rate = commissionRates['0'][level-1]; // Default to lowest tier
    
    for (let threshold in commissionRates) {
        if (turnover >= Number(threshold)) {
            rate = commissionRates[threshold][level-1];
        } else {
            break;
        }
    }
    // console.log('Rate',rate);
    return rate;
}

async function calculateUserTurnover(userId) {
    const result = await TransactionModel.aggregate([
        {
            $match: {
                user: userId,
                transactionType: "DEPOSIT",
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
    
    return result.length > 0 ? result[0].total : 0;
}

module.exports.verifyWithdrawalUSDT = async (request, response) => {
    try {
        const { transactionId, status } = request.body;

        const transaction = await TransactionModel.findOne({
            _id: transactionId,
            transactionType: "WITHDRAW",
            status: "PENDING"
        }).populate('user');

        if (!transaction) {
            throw CustomErrorHandler.notFound("Transaction Not Found!");
        }
        console.log('transaction id',transactionId);
        console.log('status id',status);
            // const contract = new web3.eth.Contract(config.ABI, config.USDT_CONTRACT_ADDRESS);
            // const amountInWei = web3.utils.toWei((Math.abs(transaction.amount)*95/100).toString(), 'ether');
            
            // const transfer = contract.methods.transfer(transaction.withdrawAddress, amountInWei);
            // const gasPrice = await web3.eth.getGasPrice();
            
            // const tx = {
            //     from: config.SENDER_ADDRESS,
            //     gasPrice: web3.utils.toHex(gasPrice),
            //     gasLimit: web3.utils.toHex(60000),
            //     to: config.USDT_CONTRACT_ADDRESS,
            //     data: transfer.encodeABI(),
            // };

        //     // const signTran = await web3.eth.accounts.signTransaction(tx, config.PRIVATE_KEY);
        //     // const sendTran = await web3.eth.sendSignedTransaction(signTran.rawTransaction);

        //     transaction.status = status;
        //     transaction.txHash = sendTran.transactionHash;
        //     transaction.blockNumber = sendTran.blockNumber;
        //     await transaction.save();
        // } else {
        if (status === "COMPLETED") {
            transaction.status = status;
            await transaction.save();
        }
        // Refund the amount if rejected
        else {
            transaction.status = "REJECTED";  // Add this line to update transaction status
            await transaction.save();         // Save the transaction status update
            
            const user = await UserModel.findById(transaction.user._id);
            user.BUSDBalance -= transaction.amount; // Since amount is negative, this adds back
            await user.save();
        }

        return response.json({
            status: true,
            message: `Withdrawal ${status.toLowerCase()} successfully`,
            data: transaction
        });

    } catch (error) {
        console.error("Error in withdrawal verification:", error);
        handleErrorResponse(error, response);
    }
};