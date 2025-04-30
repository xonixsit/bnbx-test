const Joi = require("joi");

module.exports.referralInfo = async (request, response, next) => {
    // // const rules = Joi.object().keys({
    // //     referralCode: Joi.string().required(),
    // // });
    // const { error } = rules.validate(request.query);
    // if (error) {
    //     return response
    //         .status(422)
    //         .json({ status: false, message: error.message, data: null });
    // } else {
    //     return next();
    // }
};

module.exports.signUp = async (request, response, next) => {
    const rules = Joi.object({
        name: Joi.string().min(3).max(40).required(),
        email: Joi.string().email().required(),
        mobile: Joi.string().required(),
        password: Joi.string().required(),
        cnfPassword: Joi.string().required(),
        referral: Joi.string().allow('', null), // Allow empty or null referral
        termsConditions: Joi.boolean(),
    });
    
    const { error } = rules.validate(request.body);
    console.log('error',error)
    if (error) {
        return response
            .status(422)
            .json({ status: false, message: error.message, data: null });
    } else {
        return next();
    }
};

module.exports.login = async (request, response, next) => {
    const rules = Joi.object().keys({
        loginId: Joi.string().required(),
        password: Joi.string().required(),
    });
    const { error } = rules.validate(request.body);

    if (error) {
        return response
            .status(422)
            .json({ status: false, message: error.message, data: null });
    }
    return next();
};

module.exports.sendOtp = async (request, response, next) => {
    const rules = Joi.object().keys({
        email: Joi.string().email(),
        mobile: Joi.string(),
    }).or('email', 'mobile');
    const { error } = rules.validate(request.body);
    if (error) {
        return response
            .status(422)
            .json({ status: false, message: error.message, data: null });
    } else {
        return next();
    }
};

module.exports.verifyOtp = async (request, response, next) => {
    const rules = Joi.object().keys({
        email: Joi.string().email(),
        mobile: Joi.string(),
        otp: Joi.number().required(),
    }).or('email', 'mobile');
    const { error } = rules.validate(request.body);
    if (error) {
        return response
            .status(422)
            .json({ status: false, message: error.message, data: null });
    } else {
        return next();
    }
};

module.exports.changePassword = async (request, response, next) => {
    const rules = Joi.object().keys({
        oldPassword: Joi.string().required(),
        newPassword: Joi.string().required(),
        cnfPassword: Joi.string().required(),
    });
    const { error } = rules.validate(request.body);
    if (error) {
        return response
            .status(422)
            .json({ status: false, message: error.message, data: null });
    } else {
        return next();
    }
};

module.exports.forgetPasswordVerifyOtp = async (request, response, next) => {
    const rules = Joi.object().keys({
        email: Joi.string().email().required(),
        mobile: Joi.string(),
        otp: Joi.number().required(),
    }).or('email', 'mobile');
    const { error } = rules.validate(request.body);
    if (error) {
        return response
            .status(422)
            .json({ status: false, message: error.message, data: null });
    } else {
        return next();
    }
};

module.exports.resetPassword = async (request, response, next) => {
    const rules = Joi.object().keys({
        newPassword: Joi.string().required(),
        cnfPassword: Joi.string().required(),
    });
    const { error } = rules.validate(request.body);
    if (error) {
        return response
            .status(422)
            .json({ status: false, message: error.message, data: null });
    } else {
        return next();
    }
};

module.exports.forgetPasswordSendOtp = async (request, response, next) => {
    const rules = Joi.object().keys({
        email: Joi.string().email().required(),
    })
    const { error } = rules.validate(request.body);
    if (error) {
        return response
            .status(422)
            .json({ status: false, message: error.message, data: null });
    } else {
        return next();
    }
};