const express = require("express");
const router = express.Router();

const walletController = require("../controller/wallet.controller");
const walletValidation = require("../validator/wallet.validator");
const paymentController = require("../controller/payment.controller");
const paymentValidation = require("../validator/payment.validator");
const { verifyJWTToken } = require("../../middleware/jwt.middleware");
const limiteRequest = require("../../middleware/limited.request.middleware");

router.get("/", walletValidation.transactionList, verifyJWTToken, walletController.transactionList);
router.get("/withdrawal-lock-status", verifyJWTToken, walletController.getWithdrawalLockStatus);
router.get("/:id", walletValidation.getSingleTransactions, verifyJWTToken, walletController.getSingleTransactions);
router.post("/swap", limiteRequest,  walletValidation.swapWallet,  verifyJWTToken,  walletController.swapWallet);
router.post("/transfer", limiteRequest, walletValidation.internalTransafer, verifyJWTToken, walletController.internalTransafer);
router.post("/transfer-between-wallets", limiteRequest, walletValidation.transferToTrade, verifyJWTToken, walletController.transferToTrade);
router.post("/trade-to-main", limiteRequest, walletValidation.tradeToMain, verifyJWTToken, walletController.tradeToMain);
router.put("/update/address", limiteRequest, walletValidation.updateWalletAddress, verifyJWTToken, walletController.updateWalletAddress);
router.post("/create/transaction/password", limiteRequest, walletValidation.createTransactionPassword, verifyJWTToken, walletController.createTransactionPassword);
router.put("/change/transaction/password", limiteRequest, walletValidation.changeTransactionPassword, verifyJWTToken, walletController.changeTransactionPassword);
router.post("/withdraw/usdt", limiteRequest, walletValidation.withdrawUsdt, verifyJWTToken, walletController.withdrawUsdt);
router.post("/convert", limiteRequest, walletValidation.convertReward, verifyJWTToken, walletController.convertReward);
router.post("/swap", limiteRequest, walletValidation.swapWallet, verifyJWTToken, walletController.swapWallet);
// router.post("/deposit/address", limiteRequest, verifyJWTToken, walletController.generateQrCode);
router.post("/stake/address", limiteRequest, paymentValidation.generateQr, verifyJWTToken, paymentController.generateQr);
router.post("/verify/stakeHash", limiteRequest, paymentValidation.verifyTransaction, verifyJWTToken, paymentController.verifyTransaction);
router.post("/verify/depositTxnhash", limiteRequest,  verifyJWTToken, paymentController.verifyDepositTxnhash);
router.post("/deposit/address", limiteRequest, paymentValidation.generateDepositQr, verifyJWTToken, paymentController.generateQr);

module.exports = router;
