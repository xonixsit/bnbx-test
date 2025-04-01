const express = require("express");
const router = express.Router();
const stakingController = require("../controller/staking.controller");
const stakingValidation = require("../validator/staking.validator");

const limiteRewuest = require("../../middleware/limited.request.middleware");
const { verifyJWTToken } = require("../../middleware/jwt.middleware");

router.post(
    "/",
    limiteRewuest,
    stakingValidation.stakeBalance,
    verifyJWTToken,
    stakingController.stakeBalance,
);

module.exports = router;
