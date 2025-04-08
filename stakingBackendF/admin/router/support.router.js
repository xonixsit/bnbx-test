const express = require("express");
const router = express.Router();

const supportController = require("../controller/support.controller");
const { verifyJWTToken } = require("../../middleware/jwt.middleware");
const supportValidator = require("../validator/support.validator");

router.get(
    "/",
    supportValidator.getSupportList,
    verifyJWTToken,
    supportController.getSupportList,
);

router.get("/:id", verifyJWTToken, supportController.getSupport);

router.delete("/:id", verifyJWTToken, supportController.deleteSupport);

router.put(
    "/:id",
    supportValidator.updateSupport,
    verifyJWTToken,
    supportController.updateSupport,
);

router.patch(
    "/:id",
    verifyJWTToken,
    supportController.adminMessage,  
);

router.get(
    "/token/:id",
    supportValidator.getTokenId,
    verifyJWTToken,
    supportController.getTokenId,
)

module.exports = router;
