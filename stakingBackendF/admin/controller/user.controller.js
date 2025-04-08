const mongoose = require('mongoose');  // Add at the top of the file
const bcrypt = require("bcrypt");
const config = require("../../config/config");
const UserModel = require("../../models/users.model");
const { handleErrorResponse, CustomErrorHandler } = require("../../middleware/CustomErrorHandler");
const TransactionModel = require("../../models/transactions.model");
const { calculateUserBalance } = require('../../services/balance.service');

module.exports.userDetails = async (request, response) => {
    try {
        const { user } = request.body;
        const { referralCode, userId } = request.query;
        const adminData = await UserModel.findOne({
            _id: user._id,
            role: "ADMIN",
            isDeleted: false,
        });
        if(!adminData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        let userExists;
        if (userId) {
            userExists = await UserModel.findById(userId).populate('fromUser');
        } else {
            userExists = await UserModel.findOne({ referralCode }).populate('fromUser');
        }
        if (!userExists) throw CustomErrorHandler.notFound("User not found!");
        
        // Get total team count
        const totalTeam = (await getReferralData(userExists._id)).totalTeam;
        
        // Use balance service to get all balance information
        const balanceInfo = await calculateUserBalance(userExists._id);

        return response.status(200).json({
            status: true,
            message: "User Details.",
            data: {
                name: userExists.name,
                referralCode: userExists.referralCode,
                email: userExists.email,
                sponser: userExists.fromUser ? userExists.fromUser.referralCode : null,
                totalTeamTurnoverBalance: balanceInfo.totalTeamTurnover || 0,  // Fixed: access from root object
                totalTeam: totalTeam,
                totalRewardBalance: balanceInfo.components.bonus || 0,
                level: userExists.level,
                totalStakedBalance: balanceInfo.components.staked || 0,
                loginId: userExists.loginId
            }
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};

// Get all team members first
const getAllTeamMembers = async (userId, members = new Set()) => {
    // Get direct referrals (downline only)
    const directReferrals = await UserModel.find({ 
        fromUser: userId, 
        isDeleted: false 
    });
    
    // Add each referral and their downline
    for (const referral of directReferrals) {
        const refId = referral._id.toString();
        if (!members.has(refId)) {
            members.add(refId);
            // Recursively get downline members
            await getAllTeamMembers(referral._id, members);
        }
    }

    // Convert back to ObjectIds for MongoDB query
    return Array.from(members).map(id => new mongoose.Types.ObjectId(id));
};


module.exports.updateUser = async (request, response) => {
    try {
        const { user, userId, name, email, mobile, isEmailVerified, 
            isMobileVerified, isWithdrawAllowed, isStakingAllowed, 
            isInternalTransferAllowed, isWithdraw, isAvailableForReward, 
            isDeleted, BUSDBalance, bonusBalance, totalStakedBalance,
            totalWithdrawalBalance, totalTeamTurnoverBalance,
            totalDirectTeamTurnoverBalance, totalRemovedStakedBalance,
            TRADEBalance, totalDelegateRewardBalance, totalUnlockRewardBalnce,
            totalReferralRewardBalance, totalStakingRewardBalance,
            totalRankBonusBalance, totalRewardBalance, isTrxPassCreated,
            airDorpLevel, stakingLevel } = request.body;
        
        const adminData = await UserModel.findOne({
            _id: user._id,
            role: "ADMIN",
            isDeleted: false,
        });
        if(!adminData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        const userData = await UserModel.findOne({
            _id: userId
        });
        if(!userData) throw CustomErrorHandler.unAuthorized("User Not Found!");

            // Check email uniqueness
            if (email) {
                const emailExists = await UserModel.findOne({ 
                    email,
                    _id: { $ne: userId } 
                });
                if (emailExists) {
                    throw CustomErrorHandler.alreadyExist("Email Already Exists!");
                }
            }
    
            // Check mobile uniqueness
            if (mobile) {
                const mobileExists = await UserModel.findOne({ 
                    mobile,
                    _id: { $ne: userId } 
                });
                if (mobileExists) {
                    throw CustomErrorHandler.alreadyExist("Mobile Already Exists!");
                }
            }
        

        name && (userData.name = name);
        email && (userData.email = email);
        mobile && (userData.mobile = mobile);
        isDeleted && (userData.isDeleted = isDeleted);
        isWithdraw && (userData.isWithdraw = isWithdraw);
        isEmailVerified && (userData.isEmailVerified = isEmailVerified);
        isMobileVerified && (userData.isMobileVerified = isMobileVerified);
        isStakingAllowed && (userData.isStakingAllowed = isStakingAllowed);
        isWithdrawAllowed && (userData.isWithdrawAllowed = isWithdrawAllowed);
        isAvailableForReward && (userData.isAvailableForReward = isAvailableForReward);
        isInternalTransferAllowed && (userData.isInternalTransferAllowed = isInternalTransferAllowed);
        isTrxPassCreated !== undefined && (userData.isTrxPassCreated = isTrxPassCreated);
        airDorpLevel !== undefined && (userData.airDorpLevel = airDorpLevel);
        stakingLevel !== undefined && (userData.stakingLevel = stakingLevel);
        await userData.save();

        return response.json({
            status: true,
            message: "User Details Updated.",
            data: userData,
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};

module.exports.userList = async (request, response) => {
    try {
        const { user } = request.body;
        const { page = 1, sizePerPage = 10, search, startDate, endDate, 
            greaterThan, lessThan, type } = request.query;

        const adminData = await UserModel.findOne({
            _id: user._id,
            role: "ADMIN",
            isDeleted: false,
        });
        if(!adminData) throw CustomErrorHandler.unAuthorized("Access Denied!");
    
        const options = {
            page,
            limit: sizePerPage,
            sort: { 
                role: 1,  // 1 for ascending: ADMIN comes before USER alphabetically
                createdAt: -1 
            },
            populate: {
                path: "fromUser",
                select: "referralCode name email profileImage",
            },
        };
        
        let query = {
            isDeleted: false  // Only filter out deleted users
        };
    
        if (search) {
            const searchRegex = new RegExp(search, "i");
            query = {
                $or: [
                    { name: { $regex: searchRegex } },
                    { email: { $regex: searchRegex } },
                    { mobile: { $regex: searchRegex } },
                    { loginId: { $regex: searchRegex } },
                    { referralCode: { $regex: searchRegex } },
                ],
                isDeleted: false
            };
        }
    
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        } else {
            if (startDate) {
                query.createdAt = { $gte: new Date(startDate) };
            }
            if (endDate) {
                query.createdAt = { $lte: new Date(endDate) };
            }
        }

        if (type === "BUSDBalance" && greaterThan && lessThan) {
            query.BUSDBalance = { $gt: greaterThan, $lt: lessThan };
        } else if (type === "totalStakedBalance" && greaterThan && lessThan) {
            query.totalStakedBalance = { $gt: greaterThan, $lt: lessThan };
        }

        const userData = await UserModel.paginate(query, options);
        if (userData.totalDocs === 0) throw CustomErrorHandler.notFound("User List Not Found!");
        
        return response.json({
            status: true,
            message: `${userData.docs.length} User Found.`,
            data: userData,
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};

module.exports.getUserById = async (request, response) => {
    try {
        const { user } = request.body;
        const { id } = request.params;
        
        const adminData = await UserModel.findOne({
            _id: user._id,
            role: "ADMIN",
            isDeleted: false,
        });
        if(!adminData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        const userData = await UserModel.findById(id).populate({
            path: "fromUser",
            select: "name email mobile referralCode",
        });
        if(!userData) throw CustomErrorHandler.notFound("User Not Found!");
        // Get detailed balance information
        const balanceInfo = await calculateUserBalance(userData._id);
        return response.json({
            status: true,
            message: "User Data",
            data: {
                ...userData.toObject(),
                balanceDetails: {
                    BUSDBalance: balanceInfo.BUSDBalance,
                    withdrawableBalance: balanceInfo.withdrawableBalance,
                    components: balanceInfo.components,
                    totalReferralRewardBalance: balanceInfo.components.referral,
                    totalBonusBalance: balanceInfo.components.bonus,
                    totalStakedBalance: balanceInfo.components.staked,
                    totalTeamTurnover: balanceInfo.components.teamTurnover
                }
            }
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};

module.exports.changeTrxPass = async (request, response) => {
    try {
        const { user, userId, password } = request.body;
        
        const adminData = await UserModel.findOne({
            _id: user._id,
            role: "ADMIN",
            isDeleted: false,
        });
        if(!adminData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        const userData = await UserModel.findById(userId)
        if(!userData) throw CustomErrorHandler.notFound("User Not Found!");

        const passwordSalt = await bcrypt.genSalt(Number(config.SALT_ROUND));
        const passwordHash = await bcrypt.hash(password, passwordSalt);
        
        userData.trxPassword = passwordHash;
        await userData.save();

        return response.json({
            status: true,
            message: "Transaction Password Changed.",
            data: userData,
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};

module.exports.changeUserLoginPass = async (request, response) => {
    try {
        const { user, userId, password } = request.body;
        
        const adminData = await UserModel.findOne({
            _id: user._id,
            role: "ADMIN",
            isDeleted: false,
        });
        if(!adminData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        const userData = await UserModel.findById(userId)
        if(!userData) throw CustomErrorHandler.notFound("User Not Found!");

        const passwordSalt = await bcrypt.genSalt(Number(config.SALT_ROUND));
        const passwordHash = await bcrypt.hash(password, passwordSalt);
        
        userData.password = passwordHash;
        await userData.save();

        return response.json({
            status: true,
            message: "User Login Password Changed.",
            data: userData,
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};

module.exports.updateUserKyc = async (request, response) => {
    try {
        const { user, userId, status, isAdharVerify, isEsign, isKyc } = request.body;

        const adminData = await UserModel.findOne({
            _id: user._id,
            role: "ADMIN",
            isDeleted: false,
        });
        if(!adminData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        const isVerified = status === "COMPLETED";

        let updateFields = {};

        if(isKyc == "true"){
            updateFields = {
                "kyc.isKycVerified": isVerified,
                "kyc.status": status,
                "kyc.approvedBy": user._id,
            }
        };

        if (isAdharVerify) {
            updateFields["kyc.adhar.isAdharVerified"] = isAdharVerify;
        };

        if (isEsign == "true") {
            updateFields["eSign.isESignVerified"] = isVerified;
            updateFields["eSign.status"] = status;
            updateFields["eSign.verfiedBy"] = user._id;
        };

        const userData = await UserModel.findByIdAndUpdate(
            {
                _id: userId,
                isDeleted: false,
            },
            {
                $set: updateFields,
            },
            {
                new: true,
            },
        );
        if (!userData) throw CustomErrorHandler.notFound("Failed To Update!");

        return response.status(200).json({
            status: true,
            message: "Update Kyc/Esign Successfully.",
            data: userData,
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};
 
module.exports.getUserReferralAllList = async (request, response) => {
    try {
        const { user } = request.body;
        const { userId } = request.query;

        const adminData = await UserModel.findOne({ 
            _id: user._id,
            role: "ADMIN",
            isDeleted: false
        });
        if(!adminData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        const checkUser = await UserModel.findById(userId);
        
        const userReferralData = await UserModel.find({
            fromUser: userId,
            isDeleted: false,
        });
        if(!userReferralData) throw CustomErrorHandler.notFound("Referral Not found!");

        let referralData = {},
            totalTeam = userReferralData.length;  // Count direct referrals first
        for (const element of userReferralData) {
            try {
                const getUserREferralData = await getReferralData(element._id);
                totalTeam += getUserREferralData.totalTeam;  // Add indirect referrals
                referralData[
                    `${element.name}-${element.referralCode}-Total Team : ${getUserREferralData.totalTeam}`
                ] = getUserREferralData.data;
            } catch (error) {
                console.log(error);
            }
        }
        let sendData = {};
        sendData[
             `${checkUser.name}-${checkUser.referralCode}- Total Team : ${totalTeam}`
        ] = referralData;

        return response.json({
            status: true,
            message: "User referral Tree",
            data: sendData,
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};

const getReferralData = async (userId) => {
    return new Promise(async (resolve) => {
        const userReferralData = await UserModel.find({
            fromUser: userId,
            isDeleted: false,
        });

        if (userReferralData.length > 0) {
            let referralData = {},
                totalTeam = userReferralData.length;  // Direct referrals count
            
            for (const element of userReferralData) {
                const getUserREferralData = await getReferralData(element._id);
                totalTeam += getUserREferralData.totalTeam;  // Add indirect referrals
                referralData[
                    `${element.name}-${element.referralCode}-Total Team : ${getUserREferralData.totalTeam}`
                ] = getUserREferralData.data;
            }
            resolve({ data: referralData, totalTeam: totalTeam });
        } else resolve({ data: null, totalTeam: 0 });
    });
};

module.exports.teamTransfer = async (request, response) => {
    try {
        const { user, fromUser, id } = request.body;
        console.log('user', user, fromUser, id);
        const adminData = await UserModel.findOne({ 
            _id: user._id,
            role: "ADMIN",
            isDeleted: false
        });
        if(!adminData) throw CustomErrorHandler.unAuthorized("Access Denied!");
        
        if(fromUser === id) throw CustomErrorHandler.wrongCredentials("From User Can't Be Same!");
        
        const beneficiaryUser = await UserModel.findById(fromUser);
        if(!beneficiaryUser) throw CustomErrorHandler.notFound("From User Not Found!");
        
        const targetUser = await UserModel.findById(id);
        if(!targetUser) throw CustomErrorHandler.notFound("Target User Not Found!");

        targetUser.fromUser = fromUser;
        await targetUser.save();

        return response.json({
            status: true,
            message: "Team Transferred.",
            data: targetUser,
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};