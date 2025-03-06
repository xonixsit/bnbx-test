const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { Op } = require('sequelize');

// Authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: error.message
    });
  }
};

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify-email/:token', authController.verifyEmail);

// Protected routes
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile/update', authMiddleware, authController.updateProfile);

module.exports = router;