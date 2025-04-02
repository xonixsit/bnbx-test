const getInvestmentPlans = require('../../config/plans.config');

exports.getInvestmentPlans = async (req, res) => {
    try {
        const plans = await getInvestmentPlans();
        
        return res.status(200).json({
            status: true,
            message: "Investment plans retrieved successfully",
            data: plans
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Error fetching investment plans",
            error: error.message
        });
    }
};