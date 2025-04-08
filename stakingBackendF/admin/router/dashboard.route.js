const express = require("express");
const router = express.Router();
const { verifyJWTToken } = require("../../middleware/jwt.middleware");
const dashboardController = require("../controller/dashboard.controller");
const dashboardValidation = require("../validator/dashboard.validator");

router.get("/", verifyJWTToken, dashboardController.dashboardData);

module.exports = router;
