const express = require("express");
const router = express.Router();

const transactionController = require("../controller/transaction.controller");
const transactionValidation = require("../validator/transaction.validator");
const { verifyJWTToken } = require("../../middleware/jwt.middleware");

router.get("/list", transactionValidation.transactionList, verifyJWTToken, transactionController.transactionList);
router.get("/:id", transactionValidation.transactionById, verifyJWTToken, transactionController.transactionById);
router.post("/verify/deposit", transactionValidation.depositeUSDT, verifyJWTToken, transactionController.verifyDepositeUSDT);


module.exports = router;
