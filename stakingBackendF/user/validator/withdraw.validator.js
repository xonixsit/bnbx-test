const Joi = require("joi");

module.exports.withdrawUsdt = (request, response, next) => {
    const rules = Joi.object().keys({
        amount: Joi.number().required().min(1),
        chain: Joi.string().valid('BEP20', 'TRC20').required(),
        address: Joi.string().required(),
        password: Joi.string().required()
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