const UserModel = require("../../models/users.model");
const PaymentModel = require("../../models/payment.model");
const TransactionModel = require("../../models/transactions.model");
const config = require("../../config/config");
const QRCode = require('qrcode');
const ethers = require("ethers");
const recepientAddress = config.RECEPIENT_ADDRESS.toLowerCase();
const nodeProvider = 'https://rpc.ankr.com/bsc';
const customHttpProvider = new ethers.providers.JsonRpcProvider(nodeProvider);
const contract = new ethers.Contract(config.USDT_CONTRACT_ADDRESS, config.ABI, customHttpProvider);
const ReferralService = require("../../services/referral.service");
const StakeService = require("../../services/stake.service");
const BalanceService = require("../../services/balance.service");

contract.on("Transfer", async (from, to, value, event) => { 
    const depositAmount = value / 10 ** 18;
    const transactionHash = event.transactionHash.toLowerCase();

    if (to.toLowerCase() == recepientAddress){
        // console.log(from, to, value, transactionHash)
        const eventData = await saveReceivedPayment(depositAmount, transactionHash);
    };
});

async function saveReceivedPayment(amount, transactionHash) {
    try {
        // Save the payment first
        const payment = await PaymentModel.create({
            recepientAddress,
            amount,
            transactionHash: transactionHash,
        });
        // console.log("Saved transaction details");

        // Find user by their transaction
        const user = await UserModel.findOne({
            walletAddress: from.toLowerCase(),
            isDeleted: false
        });

        if (user) {
            // Create transaction record
            const transaction = await TransactionModel.create({
                user: user._id,
                amount: amount,
                transactionType: "DEPOSIT",
                currentBalance: user.BUSDBalance,
                description: "Please Wait for approval.",
                status: "PENDING"
            });

            // Process referral bonus automatically when payment is received
            if (transaction && user.referredBy) {
                await ReferralService.processReferralBonus(user, amount);
            }
        }
    } catch(e) {
        console.log(e);
    }
}

exports.generateQr = async (req, res) => {
    try {
        const { amount, network } = req.body;
        // recepientAddress = process.env.BEP20_WALLET_ADDRESS;
        // Get network specific address
        const depositAddress = network === 'BEP20' 
            ? process.env.BEP20_WALLET_ADDRESS_QR
            : process.env.TRC20_WALLET_ADDRESS_QR
            
        // Generate QR code
        const qrCode = await QRCode.toDataURL(depositAddress);

        return res.status(200).json({
            status: true,
            message: "QR code generated successfully",
            body: {
                data: qrCode,
                depositAddress: depositAddress,
                message1: "Address will expire in 15 minutes",
                network: network
            }
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Error generating QR code",
            error: error.message
        });
    }
};

//Staking / Deposit
module.exports.verifyTransaction = async (request, response) => {
    const { user, amount, transactionHash, planId, planName, dailyRate, lockPeriod, network, fromDeposit, balanceType,isBonusStake } = request.body;
    try {
        // Validate user
        const userData = await StakeService.validateUser(user._id);
        console.log('transactionHash',transactionHash);
        // Check for existing transaction
        await StakeService.checkExistingTransaction(transactionHash);
        // Create stake
        await StakeService.createStake(userData, {
            amount,
            planId,
            planName,
            dailyRate,
            lockPeriod,
            network,
            fromDeposit,
            transactionHash,
            balanceType,isBonusStake
        });

        return response.json({
            status: true,
            message: "Transaction verification submitted successfully. Awaiting approval.",
            data: null
        });

    } catch (error) {
        console.error(error);
        return response.status(error.message.includes("not found") ? 401 : 500).json({
            status: false,
            message: error.message || "Something Went Wrong!",
            data: null
        });
    }
};

//Only Deposit
module.exports.verifyDepositTxnhash = async (request, response) => {
    const { user, amount, transactionHash, network } = request.body;
    console.log("Depost:", request.body);
    try {
        // Validate user
        const userData = await StakeService.validateUser(user._id);

        // Check for existing transaction
        await StakeService.checkExistingTransaction(transactionHash);

        await TransactionModel.create({
            user: userData._id,
            amount,
            transactionType: "DEPOSIT",
            balanceType: "BUSD",
            currentBalance: userData.BUSDBalance,
            description: "Please Wait for approval.",
            status: "PENDING",
            chain: network,
            txHash: transactionHash,
            planDetails: {
                lockPeriod: 0,
                dailyRate: 0,
                isStaking: false
            }
        });
        return response.json({
            status: true,
            message: "Transaction verification submitted successfully. Awaiting approval.",
            data: null
        });

    } catch (error) {
        console.error(error);
        return response.status(error.message.includes("not found") ? 401 : 500).json({
            status: false,
            message: error.message || "Something Went Wrong!",
            data: null
        });
    }
};