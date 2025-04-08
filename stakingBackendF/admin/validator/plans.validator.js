const Joi = require("joi");
const { handleErrorResponse } = require("../../middleware/CustomErrorHandler");

module.exports.getPlansList = async (request, response, next) => {
    next();
};

module.exports.updatePlan = async (request, response, next) => {
    try {
        const bodySchema = Joi.object({
            rate: Joi.number().min(0).max(1).required(),
            min: Joi.number().min(0).required(),
            max: Joi.number().min(0).required()
        }).unknown(true);

        await bodySchema.validateAsync(request.body);
        next();
    } catch (error) {
        handleErrorResponse(error, response);
    }
};