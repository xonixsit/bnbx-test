const express = require('express');
const router = express.Router();
const plansController = require('../controller/plans.controller');

router.get('/investment-plans', plansController.getInvestmentPlans);

module.exports = router;