const express = require("express");
const router = express.Router();
const { verifyJWTToken } = require("../../middleware/jwt.middleware");
const plansController = require("../controller/plans.controller");
const plansValidation = require("../validator/plans.validator");

router.get("/list", plansValidation.getPlansList, verifyJWTToken, plansController.getPlansList);
router.put("/update/:id", plansValidation.updatePlan, verifyJWTToken, plansController.updatePlan);

module.exports = router;