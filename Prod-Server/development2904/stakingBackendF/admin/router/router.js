const express = require("express");
const router = express.Router();

const authRouter = require("./auth.route");
const dashboardRouter = require("./dashboard.route");
const userRouter = require("./user.route");
const transactionRouter = require("./transaction.route");
const plansRouter = require("./plans.route");
const tradeRoutes = require("./trade.route");
const portfolioRoutes = require("./portfolio.route");

router.use("/auth", authRouter);
router.use("/dashboard", dashboardRouter);
router.use("/user", userRouter);
router.use("/transaction", transactionRouter);
router.use("/plans", plansRouter);
router.use("/trades", tradeRoutes);
router.use("/portfolio", portfolioRoutes);

module.exports = router;