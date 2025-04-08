const PlansModel = require('../models/plans.model');

const getInvestmentPlans = async () => {
    try {
        let plans = await PlansModel.find({ isDeleted: false }).sort({ id: 1 });
        
        // if (!plans.length) {
        //     // Default plans if none exist in DB
        //     const defaultPlans = [
        //         { id: 1, name: 'Basic', min: 100, max: 499, rate: 0.0166 },
        //         { id: 2, name: 'Advance', min: 500, max: 999, rate: 0.02 },
        //         { id: 3, name: 'Premium', min: 1000, max: 4999, rate: 0.0233 },
        //         { id: 4, name: 'Expert', min: 5000, max: 9999999999, rate: 0.025 }
        //     ];

        //     // Insert default plans
        //     plans = await PlansModel.insertMany(defaultPlans);
        // }

        return plans;
    } catch (error) {
        console.error('Error fetching plans:', error);
        return [];
    }
};

module.exports = getInvestmentPlans;