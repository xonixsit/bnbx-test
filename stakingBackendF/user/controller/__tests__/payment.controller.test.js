const PaymentModel = require("../../../models/payment.model");
const UserModel = require("../../../models/users.model");
const TransactionModel = require("../../../models/transactions.model");
const ReferralService = require("../../../services/referral.service");

// Mock the models and services
jest.mock("../../../models/payment.model");
jest.mock("../../../models/users.model");
jest.mock("../../../models/transactions.model");
jest.mock("../../../services/referral.service");

describe('saveReceivedPayment', () => {
    // Reset all mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully save payment and create transaction for user with referral', async () => {
        // Mock data
        const amount = 100;
        const transactionHash = "0x123";
        const mockUser = {
            _id: 'user123',
            BUSDBalance: 500,
            referredBy: 'referrer123'
        };
        const mockPayment = {
            _id: 'payment123',
            recepientAddress: 'recipient123',
            amount: amount,
            transactionHash: transactionHash
        };
        const mockTransaction = {
            _id: 'transaction123',
            user: mockUser._id,
            amount: amount
        };

        // Setup mocks
        PaymentModel.create.mockResolvedValue(mockPayment);
        UserModel.findOne.mockResolvedValue(mockUser);
        TransactionModel.create.mockResolvedValue(mockTransaction);
        ReferralService.processReferralBonus.mockResolvedValue(true);

        // Execute function
        await saveReceivedPayment(amount, transactionHash);

        // Assertions
        expect(PaymentModel.create).toHaveBeenCalledWith({
            recepientAddress,
            amount,
            transactionHash
        });
        expect(UserModel.findOne).toHaveBeenCalled();
        expect(TransactionModel.create).toHaveBeenCalledWith({
            user: mockUser._id,
            amount: amount,
            transactionType: "DEPOSIT",
            currentBalance: mockUser.BUSDBalance,
            description: "Please Wait for approval.",
            status: "PENDING"
        });
        expect(ReferralService.processReferralBonus).toHaveBeenCalledWith(mockUser, amount);
    });

    it('should save payment but not create transaction when user is not found', async () => {
        const amount = 100;
        const transactionHash = "0x123";
        const mockPayment = {
            _id: 'payment123',
            recepientAddress: 'recipient123',
            amount: amount,
            transactionHash: transactionHash
        };

        // Setup mocks
        PaymentModel.create.mockResolvedValue(mockPayment);
        UserModel.findOne.mockResolvedValue(null);

        // Execute function
        await saveReceivedPayment(amount, transactionHash);

        // Assertions
        expect(PaymentModel.create).toHaveBeenCalled();
        expect(UserModel.findOne).toHaveBeenCalled();
        expect(TransactionModel.create).not.toHaveBeenCalled();
        expect(ReferralService.processReferralBonus).not.toHaveBeenCalled();
    });

    it('should save payment and create transaction but not process referral for user without referrer', async () => {
        const amount = 100;
        const transactionHash = "0x123";
        const mockUser = {
            _id: 'user123',
            BUSDBalance: 500,
            referredBy: null
        };
        const mockPayment = {
            _id: 'payment123',
            recepientAddress: 'recipient123',
            amount: amount,
            transactionHash: transactionHash
        };
        const mockTransaction = {
            _id: 'transaction123',
            user: mockUser._id,
            amount: amount
        };

        // Setup mocks
        PaymentModel.create.mockResolvedValue(mockPayment);
        UserModel.findOne.mockResolvedValue(mockUser);
        TransactionModel.create.mockResolvedValue(mockTransaction);

        // Execute function
        await saveReceivedPayment(amount, transactionHash);

        // Assertions
        expect(PaymentModel.create).toHaveBeenCalled();
        expect(UserModel.findOne).toHaveBeenCalled();
        expect(TransactionModel.create).toHaveBeenCalled();
        expect(ReferralService.processReferralBonus).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
        const amount = 100;
        const transactionHash = "0x123";
        const error = new Error('Database error');

        // Setup mock to throw error
        PaymentModel.create.mockRejectedValue(error);

        // Spy on console.log
        const consoleSpy = jest.spyOn(console, 'log');

        // Execute function
        await saveReceivedPayment(amount, transactionHash);

        // Assertions
        expect(consoleSpy).toHaveBeenCalledWith(error);
        expect(TransactionModel.create).not.toHaveBeenCalled();
        expect(ReferralService.processReferralBonus).not.toHaveBeenCalled();

        // Restore console.log
        consoleSpy.mockRestore();
    });
});