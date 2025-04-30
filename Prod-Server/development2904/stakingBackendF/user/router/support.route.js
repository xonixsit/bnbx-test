const express = require("express");
const router = express.Router();
const supportController = require("../controller/support.controller");
const { verifyJWTToken } = require("../../middleware/jwt.middleware");
const limiteRewuest = require("../../middleware/limited.request.middleware");
const supportValidator = require("../validator/support.validator");
const multer = require('multer');
const inMemoryStorage = multer.memoryStorage();
const uploadStrategy = multer({ storage: inMemoryStorage }).array('images');

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
    supportController.userMessage,
);

router.get("/token/:id", supportValidator.getTokenId, verifyJWTToken, supportController.getTokenId);

router.post("/", limiteRewuest, supportValidator.addSupport, uploadStrategy, verifyJWTToken, supportController.addSupport);
    
module.exports = router;
