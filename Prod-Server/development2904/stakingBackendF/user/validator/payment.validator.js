const Joi = require("joi");
const config = require("../../config/config")

module.exports.generateQr = (request, response, next) => {
    const rules = Joi.object().keys({
        amount: Joi.number().required(),
        network: Joi.string().valid('BEP20', 'TRC20').required(),
        planId: Joi.number().required(),
        planName: Joi.string().required(),
        dailyRate: Joi.number().required(),
        lockPeriod: Joi.string().valid('30', '60', '90', '180').required(),
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

module.exports.generateDepositQr = (request, response, next) => {
    const rules = Joi.object().keys({
        amount: Joi.number().required(),
        network: Joi.string().valid('BEP20', 'TRC20').required(),
        planId: Joi.number().optional(),
        planName: Joi.string().optional(),
        dailyRate: Joi.number().optional(),
        lockPeriod: Joi.string().valid('30', '60', '90', '180').optional(),
        fromDeposit: Joi.boolean().optional(),
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

module.exports.verifyTransaction = (request, response, next) => {
    console.log(request.body);
    const rules = Joi.object().keys({
        transactionHash: Joi.string().required(),
        network: Joi.string().valid('BEP20', 'TRC20').optional(),
        isBonusStake: Joi.boolean().optional(),
        amount: Joi.number().required(),
        depositAmount: Joi.number().optional(),
        planId: Joi.number().required(),
        planName: Joi.string().required(),
        balanceType: Joi.string().optional(),
        dailyRate: Joi.when('fromDeposit', {
            is: true,
            then: Joi.number().optional(),
            otherwise: Joi.number().required()
        }),
        lockPeriod: Joi.number().valid(30, 60, 90, 180).required(),
        fromDeposit: Joi.boolean().optional()
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


module.exports.verifyDeposit = (request, response, next) => {
    console.log(request.body);
    const rules = Joi.object().keys({
        transactionHash: Joi.string().required(),
        amount: Joi.number().required()
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
