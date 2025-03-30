const Joi = require("joi");

module.exports.uploadBanner = async (request, response, next) => {
    let rules = Joi.object().keys({
        title: Joi.string().required(),
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

module.exports.getBanner = async (request, response, next) => {
    let rules = Joi.object().keys({
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

module.exports.deleteBanner = async (request, response, next) => {
    let rules = Joi.object().keys({
        bannerId: Joi.string().required(),
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

module.exports.uploadExcel = async (request, response, next) => {
    let rules = Joi.object().keys({
        title: Joi.string().required(),
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

module.exports.getEvent = async (request, response, next) => {
    let rules = Joi.object().keys({});

    const { error } = rules.validate(request.query);
    if (error) {
        return response
            .status(422)
            .json({ status: false, message: error.message, data: null });
    } else {
        return next();
    }
};

module.exports.createEvent = async (request, response, next) => {
    let rules = Joi.object().keys({
        title: Joi.string().required(),
        message: Joi.string().required(),
        url: Joi.string().required(),
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