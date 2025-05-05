const express = require('express');
const router = express.Router();
const portfolioController = require('../controller/portfolio.controller');
const { verifyJWTToken } = require("../../middleware/jwt.middleware");

// Create new portfolio entry
router.post('/',
    verifyJWTToken,
    portfolioController.createPortfolio
);

// Get latest portfolio entry
router.get('/latest',
    verifyJWTToken,
    portfolioController.getLatestPortfolio
);

// Get all portfolio entries
router.get('/',
    portfolioController.getLatestPortfolio
);

// Update portfolio entry
router.put('/:id',
    verifyJWTToken,
    portfolioController.updatePortfolio
);

// Delete portfolio entry
router.delete('/:id',
    verifyJWTToken,
    portfolioController.deletePortfolio
);

module.exports = router;