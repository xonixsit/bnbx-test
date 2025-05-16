const express = require("express");
const router = express.Router();

const userController = require("../controller/user.controller");
const userValidation = require("../validator/user.validator");
const { verifyJWTToken } = require("../../middleware/jwt.middleware");

router.get("/details", userValidation.userDetails, verifyJWTToken, userController.userDetails);
router.put("/update", userValidation.updateUser, verifyJWTToken, userController.updateUser);
router.get("/list", userValidation.getUserList, verifyJWTToken, userController.userList);
router.get("/:id", userValidation.getUserById, verifyJWTToken, userController.getUserById);
router.put("/change/trx/password", userValidation.changePassword, verifyJWTToken, userController.changeTrxPass);
router.put("/change/login/password", userValidation.changePassword, verifyJWTToken, userController.changeUserLoginPass);
router.get("/referral/tree", userValidation.getUserReferralAllList, verifyJWTToken, userController.getUserReferralAllList);
router.put("/team/transfer", userValidation.teamTransfer, verifyJWTToken, userController.teamTransfer);
router.delete("/delete/:userId", userValidation.deleteUser, verifyJWTToken, userController.deleteUser);
module.exports = router;