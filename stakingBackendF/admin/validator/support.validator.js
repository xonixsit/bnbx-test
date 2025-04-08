const Joi = require("joi");

module.exports.getSupportList = (request, response, next) => {
    let rules = Joi.object().keys({
        page: Joi.number().required(),
        sizePerPage: Joi.number().required(),
        type: Joi.string(),
        startDate: Joi.date(),
        endDate: Joi.date(),
        status: Joi.string().valid(
            "completed",
            "pending",
            "rejected",
            "cancelled",
        ),
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

module.exports.updateSupport = (request, response, next) => {
    let rules = Joi.object().keys({
        status: Joi.string()
            .required()
            .valid("completed", "pending", "rejected", "cancelled"),
        adminReplay: Joi.string().required(),
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

module.exports.getTokenId = (request, response, next) => {
    let rules = Joi.object().keys({
        id: Joi.number().required(),
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
