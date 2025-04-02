const PlansModel = require("../../models/plans.model");
const UserModel = require("../../models/users.model");
const getInvestmentPlans = require("../../config/plans.config");
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

        const plans = await getInvestmentPlans();

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

        const plans = await getInvestmentPlans();
        const planIndex = plans.findIndex(plan => plan.id === parseInt(id));
        if (planIndex === -1) throw CustomErrorHandler.notFound("Plan not found!");

        // Update plan in database
        const updatedPlan = await PlansModel.findOneAndUpdate(
            { id: parseInt(id) },
            {
                rate: rate || plans[planIndex].rate,
                min: min || plans[planIndex].min,
                max: max || plans[planIndex].max
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