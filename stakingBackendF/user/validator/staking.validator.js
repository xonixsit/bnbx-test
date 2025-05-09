const Joi = require("joi");
const config = require("../../config/config")

module.exports.stakeBalance = (request, response, next) => {
    const rules = Joi.object().keys({
        amount: Joi.number().required().min(Number(config.MIN_AMOUNT)),
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
