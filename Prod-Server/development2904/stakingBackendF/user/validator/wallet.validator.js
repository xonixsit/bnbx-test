const Joi = require("joi");
const config = require("../../config/config");

module.exports.transactionList = (request, response, next) => {
    const rules = Joi.object().keys({
        page: Joi.number().required(),
        sizePerPage: Joi.number().required(),
        transactionType: Joi.string().valid("FUND-TRANSFER", "BOND-IN", "DEPOSIT", "WITHDRAW", "CONVERT-REWARD"),
        status: Joi.string().valid("COMPLETED", "FAILED", "PENDING", "REJECTED"),
        // startDate: Joi.date(),
        // endDate: Joi.date(),
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

module.exports.transferToTrade = (request, response, next) => {
    const rules = Joi.object().keys({
        amount: Joi.number().required().min(1),
        password: Joi.string().required(),
        user: Joi.object().keys({
            _id: Joi.string().required(),
            referralCode: Joi.string().allow('').optional()
        }).required().unknown(true)
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

module.exports.tradeToMain = (request, response, next) => {
    const rules = Joi.object().keys({
        amount: Joi.number().required().min(1),
        password: Joi.string().required(),
        user: Joi.object().keys({
            _id: Joi.string().required(),
            referralCode: Joi.string().allow('').optional()
        }).required().unknown(true)
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

module.exports.getSingleTransactions = (request, response, next) => {
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

module.exports.swapWallet = (request, response, next) => {
    const rules = Joi.object().keys({
        amount: Joi.number().required().min(1),
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

module.exports.convertReward = (request, response, next) => {
    const rules = Joi.object().keys({
        // amount: Joi.number().required().min(10),
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

module.exports.internalTransafer = (request, response, next) => {
    const rules = Joi.object().keys({
        referralCode: Joi.string().required(),
        amount: Joi.number().required().min(1),
        // password: Joi.string().min(8).max(30)
        //     .pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/) // At least one digit, one lowercase, and one uppercase letter
        //     .message('Password must contain at least one digit, one lowercase letter, one uppercase letter, and one special character.')
        //     .required(),
        password: Joi.string().required(),
    });
    console.log(request.body)
    const { error } = rules.validate(request.body);
    console.log('error',error)
    if (error) {
        return response
            .status(422)
            .json({ status: false, message: error.message, data: null });
    } else {
        next();
    }
};

module.exports.withdrawUsdt = (request, response, next) => {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
        return response.status(401).json({
            status: false,
            message: "Authorization header missing",
            data: null
        });
    }

    const rules = Joi.object().keys({
        amount: Joi.number().required().min(1),
        chain: Joi.string().valid('BEP20', 'TRC20').required(),
        source: Joi.string().valid('DEPOSIT', 'REFER-INCOME', 'SIGNUP-BONUS').required(),
        address: Joi.string()
            .custom((value, helpers) => {
                const chain = helpers.state.ancestors[0].chain;
                if (chain === 'BEP20' && !/^0x[0-9a-fA-F]{40}$/.test(value)) {
                    return helpers.error('Invalid BEP20 wallet address format');
                }
                if (chain === 'TRC20' && !/^T[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{33}$/.test(value)) {
                    return helpers.error('Invalid TRC20 wallet address format');
                }
                return value;
            })
            .required()
            .messages({
                'any.custom': '{#label} format is invalid'
            }),
        password: Joi.string().required(),
        user: Joi.object().keys({
            _id: Joi.string().required(),
            referralCode: Joi.string().allow('').optional()
        }).required().unknown(true)  // Allow other user properties
    });
    
    const { error } = rules.validate(request.body);
    if (error) {
        return response.status(422).json({ 
            status: false, 
            message: error.message, 
            data: null 
        });
    }
    next();
};

module.exports.createTransactionPassword = (request, response, next) => {
    const rules = Joi.object().keys({
        // password: Joi.string().min(8).max(30)
        //     .pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/) // At least one digit, one lowercase, and one uppercase letter
        //     .message('Password must contain at least one digit, one lowercase letter, one uppercase letter, and one special character.')
        //     .required(),
        // cnfPassword: Joi.string().valid(Joi.ref('password')).required(),
        password: Joi.string().required(),
        cnfTxnPassword: Joi.string().required(),
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

module.exports.changeTransactionPassword = (request, response, next) => {
    let rules = Joi.object().keys({
        // prevPassword: Joi.string().min(8).max(30)
        //     .pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/) // At least one digit, one lowercase, and one uppercase letter
        //     .message('Password must contain at least one digit, one lowercase letter, one uppercase letter, and one special character.')
        //     .required(),
        // newPassword: Joi.string().valid(Joi.ref('prevPassword')).required(),
        // cnfPassword: Joi.string().valid(Joi.ref('prevPassword')).required(),
        oldPassword: Joi.string().required(),
        newPassword: Joi.string().required(),
        confirmPassword: Joi.string().required(),
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

module.exports.updateWalletAddress = (request, response, next) => {
    const rules = Joi.object().keys({
        address: Joi.string().pattern(/^(0x)?[0-9a-fA-F]{40}$/).required(),
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

// BlockBee
module.exports.generateQrCode = (request, response, next) => {
    const rules = Joi.object().keys({
        tiker: Joi.string().valid("trc20", "bep20").required(),
        callbackUrl: Joi.string().required(),
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