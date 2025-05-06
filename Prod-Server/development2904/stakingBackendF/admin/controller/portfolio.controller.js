const Portfolio = require('../../models/portfolio.model');
const Joi = require('joi');

// Create new portfolio entry
exports.createPortfolio = async (req, res) => {
    try {
        const bodySchema = Joi.object({
            tradingFunds: Joi.required(),
            safuFunds: Joi.required()
        }).unknown(true);

        await bodySchema.validateAsync(req.body);

        const { tradingFunds, safuFunds } = req.body;

        const portfolio = new Portfolio({
            tradingFunds,
            safuFunds,
            timestamp: new Date()
        });

        const savedPortfolio = await portfolio.save();
        res.status(201).json(savedPortfolio);
    } catch (error) {
        res.status(500).json({ message: 'Error creating portfolio entry', error: error.message });
    }
};

// Get latest portfolio entry
exports.getLatestPortfolio = async (req, res) => {
    // console.log('getLatestPortfolio');
    try {
        const latestPortfolio = await Portfolio.findOne().sort({ timestamp: -1 });
        if (!latestPortfolio) {
            return res.status(404).json({ message: 'No portfolio entries found' });
        }
        res.json(latestPortfolio);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching portfolio data', error: error.message });
    }
};

// Get all portfolio entries
exports.getAllPortfolios = async (req, res) => {
    try {
        const portfolios = await Portfolio.find().sort({ timestamp: -1 });
        res.json(portfolios[0].data[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching portfolio entries', error: error.message });
    }
};

// Update portfolio entry
exports.updatePortfolio = async (req, res) => {
    try {
        const bodySchema = Joi.object({
            tradingFunds: Joi.number().min(0).required(),
            safuFunds: Joi.number().min(0).required()
        }).unknown(true);

        await bodySchema.validateAsync(req.body);

        const { id } = req.params;
        const { tradingFunds, safuFunds } = req.body;

        const updatedPortfolio = await Portfolio.findByIdAndUpdate(
            id,
            {
                tradingFunds,
                safuFunds,
                timestamp: new Date()
            },
            { new: true }
        );

        if (!updatedPortfolio) {
            return res.status(404).json({ message: 'Portfolio entry not found' });
        }

        res.json(updatedPortfolio);
    } catch (error) {
        res.status(500).json({ message: 'Error updating portfolio entry', error: error.message });
    }
};

// Delete portfolio entry
exports.deletePortfolio = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedPortfolio = await Portfolio.findByIdAndDelete(id);

        if (!deletedPortfolio) {
            return res.status(404).json({ message: 'Portfolio entry not found' });
        }

        res.json({ message: 'Portfolio entry deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting portfolio entry', error: error.message });
    }
};