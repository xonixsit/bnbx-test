const express = require("express");
const router = express.Router();

const newsValidation = require("../validator/notification.validator");
const newsController = require("../controller/notification.controller");

const { verifyJWTToken } = require("../../middleware/jwt.middleware");

router.get("/banner", newsValidation.getBanner, newsController.getBanner);
router.get("/event", newsValidation.getBanner, newsController.getEventNotification);

module.exports = router;