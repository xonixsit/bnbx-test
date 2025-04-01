const mongoose = require('mongoose');
const UserModel = require('../models/users.model');
const TransactionModel = require('../models/transactions.model');
const walletController = require('../user/controller/wallet.controller');

describe('Wallet Controller Tests', () => {
    let mockUser;
    let mockTransaction;

    beforeAll(async () => {
        jest.setTimeout(30000); // Increase timeout
        try {
            await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/test_db', {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
        } catch (error) {
            console.error('MongoDB connection error:', error);
            throw error;
        }
    });

    afterAll(async () => {
        try {
            await mongoose.connection.close();
            await new Promise(resolve => setTimeout(resolve, 1000)); // Allow time for cleanup
        } catch (error) {
            console.error('Error closing MongoDB connection:', error);
            throw error;
        }
    });

    beforeEach(async () => {
        await UserModel.deleteMany({});
        await TransactionModel.deleteMany({});

        mockUser = await UserModel.create({
            _id: new mongoose.Types.ObjectId(),
            BUSDBalance: 1000,
            TRADEBalance: 500,
            isWithdrawAllowed: true,
            isTrxPassCreated: true,
            trxPassword: 'hashedPassword',
            isDeleted: false
        });

        mockTransaction = await TransactionModel.create({
            _id: new mongoose.Types.ObjectId(),
            user: mockUser._id,
            amount: 100,
            transactionType: 'DEPOSIT',
            status: 'COMPLETED',
            createdAt: new Date()
        });
    });

    describe('Balance Integrity Tests', () => {
        it('should maintain correct balance after deposit and withdrawal', async () => {
            const deposits = await TransactionModel.find({
                user: mockUser._id,
                transactionType: 'DEPOSIT',
                status: 'COMPLETED'
            });

            const withdrawals = await TransactionModel.find({
                user: mockUser._id,
                transactionType: 'WITHDRAW',
                status: 'COMPLETED'
            });

            const totalDeposits = deposits.reduce((sum, tx) => sum + tx.amount, 0);
            const totalWithdrawals = withdrawals.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
            const expectedBalance = totalDeposits - totalWithdrawals;

            const updatedUser = await UserModel.findById(mockUser._id);
            expect(updatedUser.BUSDBalance).toBe(expectedBalance);
        });

        it('should prevent withdrawal exceeding balance', async () => {
            const req = {
                body: {
                    user: mockUser,
                    amount: mockUser.BUSDBalance + 100,
                    chain: 'BEP20',
                    password: 'hashedPassword'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await walletController.withdrawUsdt(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: false,
                    message: 'Low USDT Balance!'
                })
            );
        });
    });

    describe('Transaction History Tests', () => {
        it('should maintain accurate running balance in transactions', async () => {
            const transactions = await TransactionModel.find({
                user: mockUser._id
            }).sort({ createdAt: 1 });

            let runningBalance = mockUser.BUSDBalance;
            for (const tx of transactions) {
                runningBalance += tx.amount;
                expect(tx.currentBalance).toBe(runningBalance);
            }
        });
    });
});