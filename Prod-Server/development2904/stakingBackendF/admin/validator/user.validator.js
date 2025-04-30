const Joi = require("joi");

module.exports.userDetails = (request, response, next) => {
    const rules = Joi.object().keys({
        referralCode: Joi.string().required(),
        userId: Joi.string().optional()
    });
    const { error } = rules.validate(request.query);
    if (error) {
        return response
            .status(422)
            .json({ status: false, message: error.message, data: null });
    } else {
        next();
    }
};

module.exports.deleteUser = (request, response, next) => {
    let rules = Joi.object().keys({
        userId: Joi.string().required()
    });
    const { error } = rules.validate(request.params);
    if (error) {
        return response
            .status(422)
            .json({ status: false, message: error.message, data: null });
    } else {
        next();
    }
};

module.exports.updateUser = (request, response, next) => {

    console.log('totalTeamTurnoverBalance',request.body.totalTeamTurnoverBalance);
    const rules = Joi.object().keys({
        userId: Joi.string().required(),
        name: Joi.string(),
        email: Joi.string(),
        isDeleted: Joi.boolean(),
        isWithdraw: Joi.boolean(),
        isEmailVerified: Joi.boolean(),
        isMobileVerified: Joi.boolean(),
        isStakingAllowed: Joi.boolean(),
        isWithdrawAllowed: Joi.boolean(),
        isReferralAllowed: Joi.boolean(),
        isAvailableForReward: Joi.boolean(),
        isInternalTransferAllowed: Joi.boolean(),
        // Additional fields
        BUSDBalance: Joi.number(),
        mobile: Joi.string(),
        bonusBalance: Joi.number().allow(null, ''),
        totalStakedBalance: Joi.number().allow(null, ''),
        totalWithdrawalBalance: Joi.number().allow(null, ''),
        totalTeamTurnoverBalance: Joi.number().allow(null, ''),
        // totalDirectTeamTurnoverBalance: Joi.number().allow(null, ''),
        // totalRemovedStakedBalance: Joi.number().allow(null, ''),
        TRADEBalance: Joi.number().allow(null, ''),
        // totalDelegateRewardBalance: Joi.number().allow(null, ''),
        // totalUnlockRewardBalnce: Joi.number().allow(null, ''),
        totalReferralRewardBalance: Joi.number().allow(null, ''),
        // totalStakingRewardBalance: Joi.number().allow(null, ''),
        // totalRankBonusBalance: Joi.number().allow(null, ''),
        totalRewardBalance: Joi.number().allow(null, ''),
        isTrxPassCreated: Joi.boolean(),
        airDorpLevel: Joi.number(),
        stakingLevel: Joi.number()
    }).or(
        'name', 'email', 'isEmailVerified', 'isMobileVerified', 'isWithdrawAllowed',
        'isStakingAllowed', 'isInternalTransferAllowed', 'isWithdraw', 'isAvailableForReward',
        'BUSDBalance', 'mobile', 'bonusBalance', 'totalStakedBalance', 'totalWithdrawalBalance',
        'totalTeamTurnoverBalance',
        'TRADEBalance', 'totalReferralRewardBalance',
        'totalRewardBalance', 'isTrxPassCreated'
        
    );
    const { error } = rules.validate(request.body);
    if (error) {
        return response
            .status(422)
            .json({ status: false, message: error.message, data: null });
    } else {
        return next();
    }
};

module.exports.getUserList = (request, response, next) => {
    let rules = Joi.object().keys({
        page: Joi.number(),
        sizePerPage: Joi.number(),
        search: Joi.string(),
        startDate: Joi.date(),
        endDate: Joi.date(),
        greaterThan: Joi.number(),
        lessThan: Joi.number(),
        type: Joi.string().valid("BUSDBalance", "totalStakedBalance")
    });
    const { error } = rules.validate(request.query);
    if (error) {
        return response
            .status(422)
            .json({ status: false, message: error.message, data: null });
    } else {
        return next();
    }
};

module.exports.getUserById = async (request, response, next) => {
    let rules = Joi.object().keys({
        id: Joi.string().required(),
    });
    const { error } = rules.validate(request.prams);
    if (error) {
        return response
            .status(422)
            .json({ status: false, message: error.message, data: null });
    } else {
        return next();
    }
};

module.exports.changePassword = (request, response, next) => {
    const rules = Joi.object().keys({
        userId: Joi.string().required(),
        password: Joi.string().required(),
    });
    const { error } = rules.validate(request.body);
    if (error) {
        return response
            .status(422)
            .json({ status: false, message: error.message, data: null });
    } else {
        next();
    }
};

module.exports.updateUserKyc = (request, response, next) => {
    let rules = Joi.object().keys({
        status: Joi.string().required().valid("COMPLETED", "REJECTED", "PENDING"),
        userId: Joi.string().required(),
        isKyc: Joi.boolean(),
        isAdharVerify: Joi.boolean(),
        isEsign: Joi.boolean(),
    });
    const { error } = rules.validate(request.body);
    if (error) {
        return response
            .status(422)
            .json({ status: false, message: error.message, data: null });
    } else {
        next();
    }
};

module.exports.getUserReferralAllList = (request, response, next) => {
    let rules = Joi.object().keys({
        userId: Joi.string().required(),
    });
    const { error } = rules.validate(request.query);
    if (error) {
        return response
            .status(422)
            .json({ status: false, message: error.message, data: null });
    } else {
        next();
    }
};

module.exports.teamTransfer = (request, response, next) => {
    let rules = Joi.object().keys({
        fromUser: Joi.string().required(),
        id: Joi.string().required(),
    });
    const { error } = rules.validate(request.body);
    if (error) {
        return response
            .status(422)
            .json({ status: false, message: error.message, data: null });
    } else {
        next();
    }
};