const TradeModel = require('../../models/trade.model');
const { handleErrorResponse, CustomErrorHandler } = require("../../middleware/CustomErrorHandler");
const UserModel = require("../../models/users.model");
const fs = require('fs');
module.exports.uploadTradeImage = async (request, response) => {
    try {
        // Get user data from JWT token
        const token = request.headers.authorization;
        if (!token) {
            throw new Error("Authorization token is required");
        }

        const user = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        
        const imageUrl = request.file ? request.file.path : null;
        if (!imageUrl) {
            throw new Error("No image file uploaded");
        }

        const adminData = await UserModel.findOne({
            _id: user._id,
            role: "ADMIN",
            isDeleted: false,
        });
        if(!adminData) throw new Error("Access Denied!");

        // Delete existing trade image if any
        await TradeModel.deleteMany({});

        // Remove duplicate check
        if (!request.file) {
            throw new Error("No image file uploaded");
        }

        // Delete existing trade image if any
        await TradeModel.deleteMany({});

        // Create new trade document
        const trade = new TradeModel({
            image: {
                data: fs.readFileSync(request.file.path),
                contentType: request.file.mimetype
            },
            filename: request.file.filename
        });
        
        // Save and verify
        const savedTrade = await trade.save();

        return response.status(201).json({
            status: true,
            message: "Trade image uploaded successfully",
            data: {
                _id: savedTrade._id,
                filename: savedTrade.filename,
                contentType: savedTrade.image.contentType,
                imageData: savedTrade.image.data.toString('base64')
            }
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};

module.exports.getTradeImage = async (request, response) => {
    try {
        const trade = await TradeModel.findOne()
            .sort({ createdAt: -1 });

        if (!trade) {
            return response.status(404).json({
                status: false,
                message: "No trade image found"
            });
        }

        return response.status(200).json({
            status: true,
            message: "Trade image fetched successfully",
            data: {
                _id: trade._id,
                filename: trade.filename,
                contentType: trade.image.contentType,
                imageData: trade.image.data.toString('base64')
            }
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};

module.exports.updateTradeImage = async (request, response) => {
    try {
        const { user } = request.body;
        const imageUrl = request.file ? request.file.path : null;

        if (!imageUrl) {
            throw CustomErrorHandler.badRequest("No image file uploaded");
        }

        const adminData = await UserModel.findOne({
            _id: user._id,
            role: "ADMIN",
            isDeleted: false,
        });
        if(!adminData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        const existingTrade = await TradeModel.findOne();
        if (!existingTrade) {
            throw CustomErrorHandler.notFound("Trade image not found");
        }

        existingTrade.imageUrl = imageUrl;
        await existingTrade.save();

        return response.status(200).json({
            status: true,
            message: "Trade image updated successfully",
            data: existingTrade
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};

module.exports.deleteTradeImage = async (request, response) => {
    try {
        const { user } = request.body;

        const adminData = await UserModel.findOne({
            _id: user._id,
            role: "ADMIN",
            isDeleted: false,
        });
        if(!adminData) throw CustomErrorHandler.unAuthorized("Access Denied!");

        const deletedTrade = await TradeModel.findOneAndDelete();

        if (!deletedTrade) {
            throw CustomErrorHandler.notFound("Trade image not found");
        }

        return response.status(200).json({
            status: true,
            message: "Trade image deleted successfully",
            data: deletedTrade
        });
    } catch (e) {
        handleErrorResponse(e, response);
    }
};