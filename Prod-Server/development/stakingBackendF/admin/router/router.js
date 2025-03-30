const express = require("express");
const router = express.Router();

const authRouter = require("./auth.route");
const dashboardRouter = require("./dashboard.route");
const userRouter = require("./user.route");
const transactionRouter = require("./transaction.route");
// const supportRouter = require("./support.router");

router.use("/auth", authRouter);
router.use("/dashboard", dashboardRouter);
router.use("/user", userRouter);
router.use("/transaction", transactionRouter);
// router.use("/support", supportRouter);

module.exports = router;
