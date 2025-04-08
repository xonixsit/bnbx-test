const PlansModel = require('../../models/plans.model');

exports.getInvestmentPlans = async (req, res) => {
    try {
        const plans = await PlansModel.find({}, {
            id: 1,
            name: 1,
            min: 1,
            max: 1,
            rate: 1,
            isActive: 1
        }).sort({ id: 1 });

        // Transform to match the expected format
        const formattedPlans = plans.map(plan => ({
            id: plan.id,
            name: plan.name,
            min: plan.min,
            max: plan.max,
            rate: plan.rate
        }));

        return res.status(200).json({
            status: true,
            message: "Investment plans retrieved successfully",
            data: formattedPlans
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Error fetching investment plans",
            error: error.message
        });
    }
};