"use strict";
const express = require("express");
const router = express.Router();

const adminRouter = require("./admin/router/router");
const userRouter = require("./user/router/router");
const plansRoutes = require('./user/router/plans.route');

router.use("/admin", adminRouter);
router.use("/user", userRouter);
router.use('/plans', plansRoutes);

module.exports = router;
