const PlansModel = require("../../models/plans.model");
const UserModel = require("../../models/users.model");
const { handleErrorResponse, CustomErrorHandler } = require("../../middleware/CustomErrorHandler");

module.exports.getPlansList = async (request, response) => {
    try {
        const { user } = request.body;

        const adminData = await UserModel.findOne({ 
            _id: user._id,
            role: "ADMIN",
            isDeleted: false
        });
        if (!adminData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        const plans = await PlansModel.find({ isActive: true }).sort({ id: 1 });

        return response.json({
            status: true,
            message: "Plans List.",
            data: plans
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};

module.exports.updatePlan = async (request, response) => {
    try {
        const { user } = request.body;
        const { id } = request.params;
        const { rate, min, max } = request.body;

        const adminData = await UserModel.findOne({ 
            _id: user._id,
            role: "ADMIN",
            isDeleted: false
        });
        if (!adminData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        const plan = await PlansModel.findOne({ id: parseInt(id), isActive: true });
        if (!plan) throw CustomErrorHandler.notFound("Plan not found!");

        const updatedPlan = await PlansModel.findOneAndUpdate(
            { id: parseInt(id) },
            {
                $set: {
                    rate: rate || plan.rate,
                    min: min || plan.min,
                    max: max || plan.max,
                    updatedAt: new Date()
                }
            },
            { new: true }
        );

        return response.json({
            status: true,
            message: "Plan updated successfully.",
            data: updatedPlan
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};