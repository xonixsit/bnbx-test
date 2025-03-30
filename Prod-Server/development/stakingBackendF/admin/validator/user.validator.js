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

module.exports.updateUser = (request, response, next) => {
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
        bonusBalance: Joi.number(),
        totalStakedBalance: Joi.number(),
        totalWithdrawalBalance: Joi.number(),
        totalTeamTurnoverBalance: Joi.number(),
        totalDirectTeamTurnoverBalance: Joi.number(),
        totalRemovedStakedBalance: Joi.number(),
        TRADEBalance: Joi.number(),
        totalDelegateRewardBalance: Joi.number(),
        totalUnlockRewardBalnce: Joi.number(),
        totalReferralRewardBalance: Joi.number(),
        totalStakingRewardBalance: Joi.number(),
        totalRankBonusBalance: Joi.number(),
        totalRewardBalance: Joi.number(),
        isTrxPassCreated: Joi.boolean(),
        airDorpLevel: Joi.number(),
        stakingLevel: Joi.number()
    }).or(
        'name', 'email', 'isEmailVerified', 'isMobileVerified', 'isWithdrawAllowed',
        'isStakingAllowed', 'isInternalTransferAllowed', 'isWithdraw', 'isAvailableForReward',
        'BUSDBalance', 'mobile', 'bonusBalance', 'totalStakedBalance', 'totalWithdrawalBalance',
        'totalTeamTurnoverBalance', 'totalDirectTeamTurnoverBalance', 'totalRemovedStakedBalance',
        'TRADEBalance', 'totalDelegateRewardBalance', 'totalUnlockRewardBalnce', 'totalReferralRewardBalance',
        'totalStakingRewardBalance', 'totalRankBonusBalance', 'totalRewardBalance', 'isTrxPassCreated',
        'airDorpLevel', 'stakingLevel'
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