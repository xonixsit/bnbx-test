const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../../config/config");
const AdminModel = require("../../models/users.model");
const { handleErrorResponse, CustomErrorHandler } = require("../../middleware/CustomErrorHandler");

module.exports.login = async (request, response) => {
    try {
        const { email, mobile, password } = request.body;

        const userData = await AdminModel.findOne({
            $or: [
                { 
                    email: email?email.toLowerCase().trim():email,
                    role: "ADMIN", 
                    isDeleted: false, 
                },
                { 
                    mobile: mobile, 
                    role: "ADMIN",
                    isDeleted: false, 
                }
            ]
        }).select("+password");
        if (!userData) {
            throw CustomErrorHandler.wrongCredentials("Not Found!");
        };

        if (!userData.isEmailVerified) {
            throw CustomErrorHandler.unAuthorized("Email Not verified!");
        };

        if (!userData.isMobileVerified) {
            throw CustomErrorHandler.unAuthorized("Mobile not verified!");
        };

        if (userData.role === "USER") {
            throw CustomErrorHandler.unAuthorized();
        };

        const checkPassword = await bcrypt.compare(password, userData.password);
        if (!checkPassword) {
            throw CustomErrorHandler.wrongCredentials("Wrong Password");
        };

        userData.lastLogin = Math.floor(Date.now() / 1000);
        await userData.save();

        const sanitizedUserData = { ...userData.toObject() };
        delete sanitizedUserData.kyc;
        delete sanitizedUserData.eSign;
        delete sanitizedUserData.password;

        const token = jwt.sign(JSON.stringify(sanitizedUserData), config.JWT_AUTH_TOKEN);

        return response.json({
            status: true,
            message: "Login success.",
            data: { sendData: { ...userData.toObject(), password: undefined }, token },
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};

module.exports.changePassword = async (request, response) => {
    try {
        const { user, oldPassword, newPassword, cnfPassword } = request.body;

        const userData = await AdminModel.findOne({
            _id: user._id,
            role: "ADMIN",
            isDeleted: false
        }).select("+password");
        if(!userData) throw CustomErrorHandler.unAuthorized("Access Denied!");
        
        if(newPassword !== cnfPassword){
            throw CustomErrorHandler.unAuthorized("Not Match Confirm Password!");
        }

        const checkPassword = await bcrypt.compare(oldPassword, userData.password);
        if(!checkPassword) throw CustomErrorHandler.wrongCredentials("Not Match Current Password!");
        
        const passwordSalt = await bcrypt.genSalt(Number(config.SALT_ROUND));
        const passwordHash = await bcrypt.hash(newPassword, passwordSalt);
        
        userData.password = passwordHash;
        await userData.save()

        return response.status(200).json({
            status: true,
            message: "Password Changed.",
            data: "",
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};