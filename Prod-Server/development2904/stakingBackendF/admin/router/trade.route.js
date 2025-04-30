const express = require('express');
const router = express.Router();
const tradeController = require('../controller/trade.controller');
const { verifyJWTToken } = require("../../middleware/jwt.middleware");
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads/trades');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        cb(null, 'trade-' + Date.now() + '.' + file.originalname.split('.').pop())
    }
});

const upload = multer({ storage: storage });

// Trade routes with image upload middleware
router.post('/upload', verifyJWTToken, upload.single('image'), tradeController.uploadTradeImage);
router.get('/get', tradeController.getTradeImage);
router.put('/update/:imgId', verifyJWTToken, upload.single('image'), tradeController.updateTradeImage);
router.delete('/delete/:imgId', verifyJWTToken, tradeController.deleteTradeImage);

module.exports = router;