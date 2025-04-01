const Joi = require("joi");

module.exports.login = async (request, response, next) => {
    const rules = Joi.object().keys({
        email: Joi.string().email(),
        mobile: Joi.string(),
        password: Joi.string().required(),
    }).or('email', 'mobile');
    const { error } = rules.validate(request.body);

    if (error) {
        return response
            .status(422)
            .json({ status: false, message: error.message, data: null });
    }
    return next();
};

module.exports.changePassword = async (request, response, next) => {
    const rules = Joi.object().keys({
        oldPassword: Joi.string().required(),
        newPassword: Joi.string().min(8).max(30)
            .pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/) // At least one digit, one lowercase, and one uppercase letter
            .message('Password must contain at least one digit, one lowercase letter, one uppercase letter, and one special character.')
            .required(),
        cnfPassword: Joi.string().valid(Joi.ref('newPassword')).required(),
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