const Joi = require("joi");

const { fileValidation } = require("../../helpers/file.validation");

module.exports.updateUser = (request, response, next) => {
    const rules = Joi.object().keys({
        name: Joi.string().min(3).max(40),
        email: Joi.string().email(),
        mobile: Joi.string().length(10).pattern(/^[6-9]\d{9}$/),
    });

    const { error, value } = rules.validate(request.body);

    if (error) {
        return response.status(422).json({
            status: false,
            message: error.message,
            data: null,
        });
    } else {
        if (value.name || value.email || value.mobile) {
            next();
        } else {
            return response.status(422).json({
                status: false,
                message: "At least one field (name, email, or mobile) must have data.",
                data: null,
            });
        }
    }
};

module.exports.referralInfo = (request, response, next) => {
    let rules = Joi.object().keys({
        referralCode: Joi.string().required(),
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

module.exports.achiverList = (request, response, next) => {
    let rules = Joi.object().keys({
        page: Joi.number().required(),
        sizePerPage: Joi.number().required(),
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

module.exports.bronzAchiverList = (request, response, next) => {
    let rules = Joi.object().keys({
        page: Joi.number().required(),
        sizePerPage: Joi.number().required(),
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

module.exports.adharKyc = (request, response, next) => {
    let rules = Joi.object().keys({
        adharNo: Joi.string().required(),
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

module.exports.verifyAdharOtp = (request, response, next) => {
    let rules = Joi.object().keys({
        clientId: Joi.string().required(),
        otp: Joi.number().required(),
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