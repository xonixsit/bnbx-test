
const fs = require("fs");
const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const userValidation = require("../validator/user.validator");
const userController = require("../controller/user.controller");
const { verifyJWTToken } = require("../../middleware/jwt.middleware");
const limiteRewuest = require("../../middleware/limited.request.middleware");

const uploadsDir = path.join(__dirname, "../../public/profileImage");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir); // Use the previously defined uploadsDir
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Generate a unique filename
    },
});
const upload = multer({ storage: storage });

router.get("/", verifyJWTToken, userController.userDetails);
router.put("/update", limiteRewuest, userValidation.updateUser, verifyJWTToken, userController.updateUser);
router.delete("/", verifyJWTToken, userController.deleteUser);
router.get("/referral/tree", verifyJWTToken, userController.getUserReferralAllList);
router.get("/referral/list", verifyJWTToken, userController.referralList);
router.get("/referral/info", userValidation.referralInfo, verifyJWTToken, userController.referralInfo);
router.get("/achiver/list", userValidation.achiverList, verifyJWTToken, userController.achiverList);
router.get("/bronz/achiver/list", userValidation.bronzAchiverList, verifyJWTToken, userController.bronzAchiverList);
router.post("/adhar/kyc", userValidation.adharKyc, verifyJWTToken, userController.adharKyc);
router.post("/verify/adhar/otp", userValidation.verifyAdharOtp, verifyJWTToken, userController.verifyAdharOtp);
router.post("/e/sign", verifyJWTToken, userController.eSign);

router.post(
    "/update/profile/image",
    upload.fields([{ name: "image", maxCount: 1 }]), // This will store the image in 'public/uploads'
    verifyJWTToken,
    userController.updateProfileImage
);

module.exports = router;
