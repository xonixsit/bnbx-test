const Joi = require("joi");

module.exports.transactionList = (request, response, next) => {
    const rules = Joi.object().keys({
        page: Joi.number().min(1).required(),
        sizePerPage: Joi.number().min(1).required(),
        status: Joi.string().valid("COMPLETED", "REQUESTED", "FAILED", 
            "PENDING", "REJECTED", "REVERSED").optional(),
        userId: Joi.string().optional(),
        transactionType: Joi.string().valid("BURN", "DEPOSIT", "BOND-IN", "WITHDRAW",
            "CONVERT-REWARD", "BOND-REWARD", "SIGNUP-BONUS", "LEVEL-AIR-DROP", "REFER-INCOME",
            "FUND-TRANSFER", "RANK-UPGRADE-BONUS", "DELEGATED-REWARD")
            .optional(),
        startDate: Joi.date().optional(),
        endDate: Joi.date().optional(),
        greaterThan: Joi.number().optional(),
        lessThan: Joi.number().optional(),
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

module.exports.transactionById = (request, response, next) => {
    const rules = Joi.object().keys({
        id: Joi.string().required(),
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

module.exports.depositeUSDT = (request, response, next) => {
    let rules = Joi.object().keys({
        transactionId: Joi.string().required(),
        status: Joi.string().valid("COMPLETED", "REJECTED").required(),
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

module.exports.withdrawUSDT = (request, response, next) => {
    let rules = Joi.object().keys({
        transactionId: Joi.string().required(),
        status: Joi.string().valid("COMPLETED", "REJECTED").required(),
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