const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "../../uploads" });
const { verifyJWTToken } = require("../../middleware/jwt.middleware");
const authController = require("../controller/auth.controller");
const authValidation = require("../validator/auth.validator");
const bannerValidation = require("../validator/banner.validator")
const bannerController = require("../controller/banner.controller");

router.post("/login", authValidation.login, authController.login);
router.put("/change/password", authValidation.changePassword, verifyJWTToken, authController.changePassword);

router.post(
    "/upload/banner",
    upload.fields([
        { name: "banner", maxCount: 1 },
    ]),
    bannerValidation.uploadBanner,
    verifyJWTToken, 
    bannerController.uploadBanner
);

router.get("/banner/list", bannerValidation.getBanner, verifyJWTToken, bannerController.getBanner);
router.delete("/banner", bannerValidation.deleteBanner, verifyJWTToken, bannerController.deleteBanner);

router.post(
    "/upload/excel",
    upload.fields([
        { name: "excel", maxCount: 1 },
    ]),
    bannerValidation.uploadExcel,
    verifyJWTToken, 
    bannerController.uploadExcel
);
router.get("/excel/list", bannerValidation.getBanner, verifyJWTToken, bannerController.getExcel);

router.post("/create/event", bannerValidation.createEvent, verifyJWTToken, bannerController.createEvent);
router.get("/get/event", bannerValidation.getEvent, verifyJWTToken, bannerController.getEvent);

module.exports = router;
