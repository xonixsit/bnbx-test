const axios = require("axios");
const config = require("../../config/config");
const UserModel = require("../../models/users.model");
const { handleErrorResponse, CustomErrorHandler } = require("../../middleware/CustomErrorHandler");
const TransactionModel = require("../../models/transactions.model");
const mongoose = require('mongoose');  // Add at the top of the file
const { calculateUserBalance } = require('../../services/balance.service');

// For updated Data
module.exports.userDetails = async (request, response) => {
    try {
        const { user } = request.body;
  
        const userData = await UserModel.findOne({
            _id: user._id,
            isDeleted: false,
        }).populate({
            path: "fromUser",
            select: "name email mobile referralCode",
        });
        if(!userData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        const userDataObj = userData.toObject();
        
        // Calculate actual referral rewards from transactions
        const balanceData = await calculateUserBalance(userData._id);
        
            // Update userDataObj using Object.assign instead of reassignment
            Object.assign(userDataObj, {
                BUSDBalance: balanceData.BUSDBalance,
                availableReferralBalance: balanceData.availableReferralBalance,
                withdrawableBalance: balanceData.withdrawableBalance,
                totalReferralRewardBalance: balanceData.totalReferralRewardBalance,
                totalBonusBalance: balanceData.totalBonusBalance,
                totalStakedBalance: balanceData.totalStakedBalance,
                totalTeamTurnover: balanceData.totalTeamTurnover,
                balanceComponents: balanceData.components
            });

        return response.json({
            status: true,
            message: "User Data get successfully.",
            data: userDataObj,
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};

module.exports.updateUser = async (request, response) => {
    try {
        const { user, name, email, mobile } = request.body;

        const userData = await UserModel.findOne({
            _id: user._id,
            isDeleted: false,
        })
        if(!userData) throw CustomErrorHandler.unAuthorized("Access Denied!");
        
        const isExist = await UserModel.findOne({
            $or: [
                { email: email },
                { mobile: mobile }
            ]
        });
        if(isExist) throw CustomErrorHandler.alreadyExist(mobile? "Mobile":"Email", "Already Exists!");

        const updateData = {};
        name && (updateData.name = name);
        email && (updateData.email = email);
        email && (updateData.isEmailVerified = false);
        mobile && (updateData.mobile = mobile);
        mobile && (updateData.isMobileVerified = false);

        const isUpdate = Object.keys(updateData).length > 0;
        if(!isUpdate) throw CustomErrorHandler.wrongCredentials("Nothing to update!");

        const updatedUser = await UserModel.findByIdAndUpdate(
            {
                _id: user._id,
            },
            {
                $set: updateData,
            },
            {
                new: true,
            },
        );
        
        return response.json({
            status: true,
            message: "Update successfully.",
            data: updatedUser,
        });
    } catch (e) {
        console.log("Error while Updating user details", e);
        handleErrorResponse(e, response);
    }
};

module.exports.updateProfileImage = async (request, response) => {
    try {
        const { user } = request.body;

        const userData = await UserModel.findOne({
            _id: user._id,
            isDeleted: false,
        })
        if(!userData) throw CustomErrorHandler.unAuthorized("Access Denied!");
        
        if(!request.files || Object.keys(request.files).length === 0) {
            throw CustomErrorHandler.wrongCredentials("Image Not Detected!");
        }

        const profileImage = request.files["image"][0];

        userData.profileImage = profileImage.filename;
        await userData.save();

        return response.json({
            status: true,
            message: "Profile Image updated.",
            data: '',
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};

module.exports.deleteUser = async (request, response) => {
    try {
        const { user } = request.body;

        const userData = await UserModel.findOne({
            _id: user._id,
            isDeleted: false,
        });
        if(!userData) throw CustomErrorHandler.notFound("Not or Deleted!");

        userData.isDeleted = true;
        await userData.save();

        return response.json({
            status: true,
            message: "User Deleted successfully.",
            data: userData,
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};

module.exports.getUserReferralAllList = async (request, response) => {
    try {
        const { user } = request.body;

        const mainUserData = await UserModel.findOne({ 
            _id: user._id,
            isDeleted: false
        });
        if(!mainUserData) throw CustomErrorHandler.unAuthorized("Access Denied!");
        
        const userReferralData = await UserModel.find({
            fromUser: user._id,
            isDeleted: false,
        });
        if(!userReferralData) throw CustomErrorHandler.notFound("Referral Not found!");

        let referralData = {},
            totalTeam = 0;
        for (const element of userReferralData) {
            try {
                const getUserREferralData = await getReferralData(element._id);
                totalTeam += getUserREferralData.totalTeam + 1;
                referralData[
                    `${element.name}-${element.referralCode}-Total Team : ${getUserREferralData.totalTeam}`
                ] = getUserREferralData.data;
            } catch (error) {
                console.log(
                    "%c 🌽 error: ",
                    "font-size:20px;background-color: #B03734;color:#fff;",
                    error,
                );
            }
        }
        let sendData = {};
        sendData[
             `${mainUserData.name}-${mainUserData.referralCode}- Total Team : ${totalTeam}`
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
                totalTeam = userReferralData.length;  // Count direct referrals
            
            for (const element of userReferralData) {
                const subTeamData = await getReferralData(element._id);
                totalTeam += subTeamData.totalTeam;  // Add only indirect referrals without +1
                referralData[
                    `${element.name}-${element.referralCode}-Total Team : ${subTeamData.totalTeam}`
                ] = subTeamData.data;
            }
            resolve({ data: referralData, totalTeam: totalTeam });
        } else resolve({ data: null, totalTeam: 0 });
    });
};

// User Info for Tree View.
module.exports.referralInfo = async (request, response) => {
    try {
        const { user } = request.body;
        const { referralCode } = request.query;

        const userData = await UserModel.findOne({
            _id: user._id,
            isDeleted: false
        });
        if(!userData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        const userExists = await UserModel.findOne({
            referralCode,
            isDeleted: false
        }).populate('fromUser');
        if (!userExists) throw CustomErrorHandler.notFound("Not found!");

        // Get total team count
        const totalTeam = (await getReferralData(userExists._id)).totalTeam;
        
        // Get direct referral count
        const directReferralCount = await UserModel.countDocuments({
            fromUser: userExists._id,
        });

        
        // Get team members and calculate turnover
        const teamMembers = await getAllTeamMembers(userExists._id);
        // Add the user's own ID to include their deposits in team turnover
        teamMembers.push(userExists._id);

        const teamTurnover = await TransactionModel.aggregate([
            {
                $match: {
                    transactionType: { $in: ["DEPOSIT", "BOND-IN"] },
                    status: "COMPLETED",
                    isDeleted: false,
                    user: { $in: teamMembers }
                }
            },
            {
                $group: {
                    _id: null,
                    totalTurnover: { $sum: "$amount" }
                }
            }
        ]);
        const totalTeamTurnover = teamTurnover.length > 0 ? teamTurnover[0].totalTurnover : 0;

        // Get bond/staking balance
        const bondBalance = await TransactionModel.aggregate([
            {
                $match: {
                    user: userExists._id,
                    transactionType: "BOND-IN",
                    status: "COMPLETED",
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);

        // Calculate total rewards from all reward-type transactions
        const totalRewards = await TransactionModel.aggregate([
            {
                $match: {
                    user: userExists._id,
                    status: "COMPLETED",
                    isDeleted: false,
                    transactionType: {
                        $in: [
                            "REFER-INCOME",
                            "SIGNUP-BONUS",
                            "LEVEL-AIR-DROP",
                            "RANK-UPGRADE-BONUS",
                            "RETURN-INTEREST"
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);

        return response.status(200).json({
            status: true,
            message: "User Info.",
            data: {
                name: userExists.name,
                referralCode: userExists.referralCode,
                email: userExists.email,
                sponser: userExists.fromUser ? userExists.fromUser.referralCode : null,
                totalTeamTurnoverBalance: totalTeamTurnover,
                totalTeam: totalTeam,
                totalRewardBalance: totalRewards.length > 0 ? totalRewards[0].total : 0,
                level: userExists.level,
                totalStakedBalance: bondBalance.length > 0 ? bondBalance[0].total : 0,  // Added bond balance
                loginId: userExists.loginId,
                directReferralTeam: directReferralCount,
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

// User referral array list
module.exports.referralList = async (request, response) => {
    try {
        const { user } = request.body;

        const userData = await UserModel.findOne({
            _id: user._id,
            isDeleted: false
        });
        // console.log('user referral list : user', user)
        if(!userData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        const userList = [];
        await buildReferralTree(userData._id, 1, userList);

        return response.status(200).json({
            status: true,
            message: "Referral List.",
            data: userList
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};

const buildReferralTree = async (userId, level = 1, userList = []) => {
    const user = await UserModel.findById(userId);
    
    if (!user) {
      return userList;
    }
    
    // Include the root user in the list
    const teamData = await getReferralData(user._id);
    userList.push({
        name: user.name,
        date: user.createdAt,
        referralCode: user.referralCode,
        level: level,
        totalTeam: teamData.totalTeam,
        totalStaked: user.totalStakedBalance || 0,
        totalTurnover: user.totalTeamTurnoverBalance || 0
    });
    
    const referrals = await UserModel.find({ 
        fromUser: userId,
        isDeleted: false 
    });

    for (const referral of referrals) {
        await buildReferralTree(referral._id, level + 1, userList);
    }
    
    return userList;
};


module.exports.achiverList = async (request, response) => {
    try {
        const { user } = request.body;
        const { page, sizePerPage } = request.query;
    
        const userData = await UserModel.findOne({
            _id: user._id,
            isDeleted: false,
        });
        if(!userData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        const options = {
            page: parseInt(page) || 1,
            limit: parseInt(sizePerPage) || 10,
            sort: { totalRewardBalance: -1 },
        };

        const query = {
            totalRewardBalance: { $gt: 3000 },
            role: { $ne: "ADMIN" },
        };
        
        // Projection to fetch only the desired fields
        const projection = {
            name: 1,
            email: 1,
            referralCode: 1,
            totalStakedBalance: 1,
            totalRewardBalance: 1,
        };
            
        const paginatedUsers = await UserModel.paginate(query, options, { select: projection });
        if (!paginatedUsers.docs.length>0) throw CustomErrorHandler.notFound("Achiver List Not found!");

        const achivers = paginatedUsers.docs.map(user => ({
            name: user.name,
            email: user.email,
            referralCode: user.referralCode,
            totalStakedBalance: user.totalStakedBalance,
            totalRewardBalance: user.totalRewardBalance,
            level: user.level,
        }));
    
        return response.json({
            status: true,
            message: "Achiever list found",
            data: {
                docs: achivers,
                totalDocs: paginatedUsers.totalDocs,
                limit: paginatedUsers.limit,
                totalPages: paginatedUsers.totalPages,
                page: paginatedUsers.page,
                pagingCounter: paginatedUsers.pagingCounter,
                hasPrevPage: paginatedUsers.hasPrevPage,
                hasNextPage: paginatedUsers.hasNextPage,
                prevPage: paginatedUsers.prevPage,
                nextPage: paginatedUsers.nextPage,
            }
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};

module.exports.bronzAchiverList = async (request, response) => {
    try {
        const { user } = request.body;
        const { page, sizePerPage } = request.query;

        const userData = await UserModel.findOne({
            _id: user._id,
            isDeleted: false,
        });
        if (!userData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        const options = {
            page: parseInt(page) || 1,
            limit: parseInt(sizePerPage) || 10,
            sort: { createdAt: -1 },
        };
        const query = {
            isBonanza: true,
        };

        const isBronzAchiverList = await UserModel.paginate(query, options);
        if (!isBronzAchiverList.docs.length>0) throw CustomErrorHandler.notFound("Bronz List Not found!");
    
        return response.json({
            status: true,
            message: "Bronz achiver list.",
            data: isBronzAchiverList,
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};

module.exports.adharKyc = async (request, response, next) => {
    try {
        const { user, adharNo } = request.body;

        const userData = await UserModel.findOne({
            _id: user._id,
            isDeleted: false,
        });
        if (!userData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        if(userData.kyc.adhar.isAdharVerified){
            throw CustomErrorHandler.alreadyExist("Already Verified!");
        };
        if(userData.kyc.status == "FAILED"){
            throw CustomErrorHandler.unAuthorized("Your verification Failed, Please contact support!");
        };

        const existingUserWithAdhar = await UserModel.findOne({
            'kyc.adhar.adharNo': adharNo,
            _id: { $ne: userData._id }
        });
        if (existingUserWithAdhar) {
            throw CustomErrorHandler.alreadyExist("Adhar Linked with Other Account!");
        };
        if(userData.kyc.isKycVerified){
            throw CustomErrorHandler.alreadyExist("Kyc Completed.");
        };

        const data = {
            id_number: adharNo,
        };

        const axiosConfig = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://kyc-api.surepass.io/api/v1/aadhaar-v2/generate-otp',
            headers: { 
              'Content-Type': 'application/json', 
              'Authorization': config.KYC_TOKEN,
            },
            data: data,
        };

        axios.request(axiosConfig)
            .then(async(res) => {
                return response.json({
                    status: true,
                    message: "Otp send on adhar linked mobile.",
                    data: res.data,
                });
            })
            .catch((error) => {
                return response.status(500).json({
                    status: false,
                    message: "Failed to send otp, try again.",
                    data: error,
                });
            });
    } catch (e) {
        handleErrorResponse(e, response);
    };
};

module.exports.verifyAdharOtp = async (request, response, next) => {
    try {
        const { user, clientId, otp } = request.body;

        const userData = await UserModel.findOne({
            _id: user._id,
            isDeleted: false,
        });
        if (!userData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        if(userData.kyc.isKycVerified){
            throw CustomErrorHandler.alreadyExist("Kyc Completed.");
        };

        const data = {
            client_id: clientId,
            otp: otp,
        };

        const axiosConfig = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://kyc-api.surepass.io/api/v1/aadhaar-v2/submit-otp',
            headers: { 
              'Content-Type': 'application/json', 
              'Authorization': config.KYC_TOKEN,
            },
            data: data,
        };

        axios.request(axiosConfig)
            .then(async(res) => {
                if(res.data.data.full_name.toUpperCase() != userData.name.replace(/ +/g, ' ').trim().toUpperCase()){
                    userData.kyc.status = "FAILED";
                    userData.kyc.adhar.adharName = res.data.data.full_name;
                    userData.kyc.adhar.adharNo = res.data.data.aadhaar_number;
                    userData.kyc.adhar.dob = res.data.data.dob;
                    userData.kyc.adhar.gender = res.data.data.gender;
                    userData.kyc.adhar.clientId = res.data.data.client_id;
                    userData.kyc.adhar.profileImage = res.data.data.profile_image;
                    userData.kyc.adhar.address = `${JSON.stringify(res.data.data.address)}`;
                    await userData.save();
                    const message = `Adhar Name: ${res.data.data.full_name.toUpperCase()}, Account Name: ${userData.name.toUpperCase()}`;
                    throw CustomErrorHandler.wrongCredentials(`Failed!, ${message}`);
                };

                userData.kyc.adhar.adharName = res.data.data.full_name;
                userData.kyc.adhar.adharNo = res.data.data.aadhaar_number;
                userData.kyc.adhar.dob = res.data.data.dob;
                userData.kyc.adhar.gender = res.data.data.gender;
                userData.kyc.adhar.clientId = res.data.data.client_id;
                userData.kyc.adhar.profileImage = res.data.data.profile_image;
                userData.kyc.adhar.address = `${JSON.stringify(res.data.data.address)}`;
                userData.kyc.adhar.isAdharVerified = true;
                userData.kyc.status = "IN-PROGRESS";
                await userData.save();

                return response.json({
                    status: true,
                    message: "Adhar verified successfully",
                    data: res.data,
                });
            })
            .catch((error) => {
                return response.status(500).json({
                    status: false,
                    message: "Failed to verify OTP",
                    data: error,
                });
            });
    } catch (e) {
        handleErrorResponse(e, response);
    };
};

module.exports.eSign = async (request, response) => {
    try {
        const { user } = request.body;

        const userData = await UserModel.findOne({
            _id: user._id,
            isDeleted: false,
        });
        if (!userData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        // const initializeData = await initilizeNSDL(userData.name, userData.mobile, userData.email);
        // await uploadContract(initializeData.client_id);

        userData.eSign.clientId = initializeData.client_id;
        await userData.save();
        
        setTimeout(async () => {
            try {      
                // await eSignReport(userData._id, initializeData.client_id);
            } catch (error) {
                console.log("Error after waiting for 10 minutes:", error);
            }
        }, 10 * 60 * 1000)

        return response.json({
            status: true,
            message: "E-Sign Initiated. Please follow This URL.",
            data: initializeData.url,
        });
    } catch (e) {
        handleErrorResponse(e, response);
    };
}
