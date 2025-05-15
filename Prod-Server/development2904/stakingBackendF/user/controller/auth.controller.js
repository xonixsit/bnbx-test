const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const utils = require("../../utils/twilio");
const config = require("../../config/config");
const UserModel = require("../../models/users.model");
const TransactionModel = require("../../models/transactions.model");
const { generateRandomString } = require("../../helpers");
const { handleErrorResponse, CustomErrorHandler } = require("../../middleware/CustomErrorHandler");

async function getUniqueUserReferralCode(referral) {
    return new Promise(async (resolve) => {
        const ref = referral ? referral : generateRandomString(8);

        referralExists = await UserModel.findOne({
            referralCode: ref,
        });

        if (!referralExists) {
            resolve(ref);
        } else {
            await getUniqueUserReferralCode(generateRandomString(8));
        }
    });
}

async function createLoginId(){
    const prefix = "BNBX";
    const randomNumber = Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit random number
    const loginId = `${prefix}${randomNumber}`;
    
    const isExists = await UserModel.findOne({loginId});
    if(isExists) {
        await createLoginId();
    };
    return loginId;
}

module.exports.referralInfo = async (request, response) => {
    try {
        const { referralCode } = request.query;

        const userData = await UserModel.findOne({
            $or: [
                { referralCode: referralCode.toUpperCase() },
                { loginId: referralCode }
            ],
        });
        if(!userData) throw CustomErrorHandler.notFound("Enter a valid referral Code!");

        return response.status(200).json({
            status: true,
            message: "Referral Code Details.",
            data: { email: userData.email, name: userData.name }
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};

module.exports.signUp = async (request, response) => {
    try {
        const { referral, name, email, mobile, password, cnfPassword } = request.body;

        const checkEmail = await UserModel.findOne({ email: email.toLowerCase().trim() });
        if (checkEmail) throw CustomErrorHandler.alreadyExist("Your Email Is Already Registered!");

        const checkMobile = await UserModel.findOne({ mobile: mobile.trim() });
        if (checkMobile) throw CustomErrorHandler.alreadyExist("Your Mobile Is Already Registered!");

        let checkReferral = false;
        if (referral) {
            checkReferral = await UserModel.findOne({
                referralCode: referral.trim(),
                isDeleted: false,
            });
        }

        if (password !== cnfPassword) {
            throw CustomErrorHandler.wrongCredentials("Confirm password does not match!");
        }

        // GENERATING PASSWORD
        const passwordSalt = await bcrypt.genSalt(config.SALT_ROUND);
        const passwordHash = await bcrypt.hash(password, passwordSalt);

        const referralCode = await getUniqueUserReferralCode();
        const loginId = await createLoginId();
        const bonusBalance = 0;
        // Fix the BUSD balance assignment
        const BUSDBalance = bonusBalance; // Changed from const BUSDBalance = bonusBalance = 10;
        
        // CREATING USER IN MONGODB
        const newUser = await UserModel.create({
            name: name.trim(),
            referralCode: referralCode.trim(),
            email: email.toLowerCase().trim(),
            mobile: mobile.trim(),
            password: passwordHash,
            isMobileVerified: true,
            isEmailVerified: true,
            bonusBalance: bonusBalance,
            BUSDBalance: BUSDBalance, // Add BUSDBalance to the create object
            isWithdrawAllowed: true,
            isStakingAllowed: true,
            isInternalTransferAllowed: true,
            loginId,
            fromUser: checkReferral && checkReferral._id ? checkReferral._id : null,
        });

        // await TransactionModel.create({
        //     amount: 0,
        //     user: newUser._id,
        //     transactionType: "SIGNUP-BONUS",
        //     stakingTime: new Date().getTime(),
        //     currentBalance: 0,
        //     description: "Early Bird Signup Bonus",
        //     approvedBy: newUser._id, // Adding the required approvedBy field
        // });

        delete newUser.password;
        const sendData = { userData: newUser };

        try {
            await utils.welcomeMail(email.toLowerCase().trim(), loginId);
            await utils.sendOtpOnMobile(mobile);
            await utils.sendOtpOnEmail(email.toLowerCase().trim());
        } catch (error) {
            console.log("Failed to send OTP!", error);
        }

        return response.status(200).json({
            status: true,
            message: "Registered successfully.",
            data: sendData,
        });
    } catch (error) {
        handleErrorResponse(error, response);
    }
};

module.exports.login = async (request, response) => {
    try {
        const { loginId, password } = request.body;

        const userData = await UserModel.findOne({
            loginId,
            isDeleted: false
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

        if (userData.role === "ADMIN") {
            throw CustomErrorHandler.unAuthorized();
        };

        const checkPassword = await bcrypt.compare(password, userData.password);
        if (!checkPassword) {
            throw CustomErrorHandler.wrongCredentials("Wrong Password!");
        };

        userData.lastLogin = Math.floor(Date.now() / 1000);
        await userData.save();

        const sanitizedUserData = { ...userData.toObject() };
        delete sanitizedUserData.profileImage;
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

// Send Otp for Verify Email or Mobile
module.exports.sendOtp = async (request, response) => {
    try {
        const { mobile, email } = request.body;

        const userData = await UserModel.findOne({
            $or: [
                { 
                    email: email?email.toLowerCase().trim():email, 
                    isDeleted: false, 
                },
                { 
                    mobile: mobile, 
                    isDeleted: false, 
                }
            ]
        });
        if (!userData) {
            throw CustomErrorHandler.wrongCredentials(mobile ? "Mobile not found!" : "Email not found!");
        };

        let res;
        if (mobile) {
            res = await utils.sendOtpOnMobile(userData.mobile);
        } else {
            res = await utils.sendOtpOnEmail(userData.email);
        };

        return response.status(200).json({
            status: res,
            message: mobile?"Otp Send on Mobile.":"Otp Send on Email.",
            data: "",
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};

// Verify Email or Password
module.exports.verifyOtp = async (request, response) => {
    try {
        const { mobile, email, otp } = request.body;

        const userData = await UserModel.findOne({
            $or: [
                { 
                    email: email?email.toLowerCase().trim():email, 
                    isDeleted: false, 
                },
                { 
                    mobile: mobile, 
                    isDeleted: false, 
                }
            ]
        });
        if (!userData) {
            throw CustomErrorHandler.wrongCredentials(mobile ? "Mobile not found!" : "Email not found!");
        };

        let res;
        if (mobile) {
            res = await utils.verifyMobileOtp(userData.mobile, otp);
        } else {
            res = await utils.verifyEmailOtp(userData.email, otp);
        };
        if(!res) throw CustomErrorHandler.notAllowed(mobile ? "Failed to verify Mobile otp!" : "Failed to verify Email otp!");

        if(mobile){
            userData.isMobileVerified = true;
        } else {
            userData.isEmailVerified = true;
        };
        await userData.save();

        return response.status(200).json({
            status: res,
            message: mobile?"Mobile Verified.":"Email Verified.",
            data: "",
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};

module.exports.changePassword = async (request, response) => {
    try {
        const { user, oldPassword, newPassword, cnfPassword } = request.body;
        console.log(user)
        const userData = await UserModel.findOne({
            _id: user._id,
            isDeleted: false
        }).select("+password");
        if(!userData) throw CustomErrorHandler.unAuthorized("Access Denied!");
        
        if(newPassword !== cnfPassword){
            throw CustomErrorHandler.unAuthorized("Not Match Confirm Password!");
        }

        const checkPassword = await bcrypt.compare(oldPassword, userData.password);
        if(!checkPassword) throw CustomErrorHandler.wrongCredentials("Not Match Current Password!");

        const passwordSalt = await bcrypt.genSalt(config.SALT_ROUND);
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

module.exports.forgetPasswordSendOtp = async (request, response) => {
    try {
        const { email } = request.body;

        const userData = await UserModel.findOne({ 
            email: email?email.toLowerCase().trim():email, 
            isDeleted: false, 
        });
        if (!userData) {
            throw CustomErrorHandler.wrongCredentials("Not found!");
        };

        const otp = Math.floor(100000 + Math.random() * 900000);
        
        const sendOtp = await utils.sendEmailOtp(userData.email, otp);
        if(!sendOtp) CustomErrorHandler.serverError("Failed to send Otp")

        userData.otp = otp;
        await userData.save();

        return response.json({
            status: true,
            message: "Otp send on mail.",
            data: "",
        });  
    } catch (e) {
        handleErrorResponse(e, response);
    };
};

module.exports.forgetPasswordVerifyOtp = async (request, response) => {
    try {
        const { email, otp } = request.body;

        const userData = await UserModel.findOne({
            email: email?email.toLowerCase().trim():email, 
            isDeleted: false, 
        });
        if (!userData) {
            throw CustomErrorHandler.wrongCredentials("Email not found!");
        };

        if(userData.otp !== otp || userData.otp == 0) {
            throw CustomErrorHandler.wrongCredentials("Invalid Otp!");
        };

        userData.otp = 0;
        await userData.save();

        const sanitizedUserData = { ...userData.toObject() };
        delete sanitizedUserData.profileImage;
        delete sanitizedUserData.password;

        const token = jwt.sign(JSON.stringify(sanitizedUserData), config.JWT_AUTH_TOKEN);

        return response.json({
            status: true,
            message: "Otp Verified, Now Reset the Password.",
            data: token,
        });  
    } catch (e) {
        handleErrorResponse(e, response);
    };
};

module.exports.resetPassword = async (request, response) => {
    try {
        const { user, newPassword, cnfPassword } = request.body;
        
        const userData = await UserModel.findOne({
            _id: user._id,
            isDeleted: false,
        });
        if(!userData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        if(newPassword !== cnfPassword){
            throw CustomErrorHandler.unAuthorized("Not Match Confirm Password!");
        };

        const passwordSalt = await bcrypt.genSalt(config.SALT_ROUND);
        const passwordHash = await bcrypt.hash(newPassword, passwordSalt);
        userData.password = passwordHash;
        await userData.save();
        
        return response.status(200).json({
            status: true,
            message: "Success Reset Password.",
            data: "",
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};