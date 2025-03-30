const SupportModel = require("../../models/support.model");
const AdminModel = require("../../models/users.model");
const config = require("../../config/config")
const { BlobServiceClient } = require('@azure/storage-blob');
const blobServiceClient = BlobServiceClient.fromConnectionString(config.BLOB_CONNECTING_STRING);
const containerClient = blobServiceClient.getContainerClient(config.BLOB_SUPORT_CONTAINER);


module.exports.updateSupport = async (request, response, next) => {
    try {
        const { id } = request.params;
        const { user, status, adminReplay } = request.body;

        const checkAdmin = await AdminModel.findOne({
            _id: user._id,
            role: "ADMIN",
            isDeleted: false
        });

        if(!checkAdmin) {
            return response.status(409).json({
              status: false,
              message: "You are not Admin",
              data: null,
            });
        }

        const message = adminReplay;

        const updateSupportStatus = await SupportModel.findOneAndUpdate(
            {
                _id: id,
            },
            {
                $set: { status },
                $push: {
                    thread: { message },
                },
            },
            {
                $new: true,
            },
        );

        if (!updateSupportStatus) {
            return response.status(409).json({
                status: false,
                message: "Error While Get Support",
                data: null,
            });
        }
        return response.json({
            status: true,
            message: "Support Get successfully",
            data: updateSupportStatus,
        });
    } catch (e) {
        return response.status(500).json({
            status: false,
            message: "Something Went To Wrong",
            data: null,
        });
    }
};

module.exports.deleteSupport = async (request, response, next) => {
    try {
        const { id } = request.params;
        const { user } = request.body;

        const checkAdmin = await AdminModel.findOne({
            _id: user._id,
            role: "ADMIN",
            isDeleted: false
        });

        if(!checkAdmin) {
            return response.status(409).json({
              status: false,
              message: "You are not Admin",
              data: null,
            });
        }

        const deleteSupport = await SupportModel.findOneAndUpdate(
            { _id: id, user: user._id },
            {
                $set: { isDeleted: true },
            },
            {
                new: true,
            },
        );

        if (!deleteSupport) {
            return response.status(400).json({
                status: false,
                message: "Error While Delete Support ",
                data: null,
            });
        }

        return response.json({
            status: true,
            message: "Support Deleted successfully",
            data: deleteSupport,
        });
    } catch (e) {
        return response.status(500).json({
            status: false,
            message: "Something Went To Wrong",
            data: null,
        });
    }
};

module.exports.getSupportList = async (request, response, next) => {
    try {
        const { page, sizePerPage, type, startDate, endDate, status } =
            request.query;
        const { user } = request.body;

        const checkAdmin = await AdminModel.findOne({
            _id: user._id,
            role: "ADMIN",
            isDeleted: false
        });

        if(!checkAdmin) {
            return response.status(409).json({
              status: false,
              message: "You are not Admin",
              data: null,
            });
        }

        const options = {
            page,
            limit: sizePerPage,
            sort: { createdAt: -1 },
            populate: {
                path: "user",
                select: "userName name email profileImage",
            },
        };
        let query = { isDeleted: false, };
        if (type) {
            query.type = type;
        }
        if (status) {
            query.status = status;
        }
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        } else {
            if (startDate) {
                query.createdAt = { $gte: new Date(startDate) };
            }
            if (endDate) {
                query.createdAt = { $lte: new Date(endDate) };
            }
        }
        const getSupportList = await SupportModel.paginate(query, options)
            

        if (!getSupportList) {
            return response.status(400).json({
                status: false,
                message: "Error While Get Support List",
                data: null,
            });
        }
        return response.json({
            status: true,
            message: "Support List Get successfully",
            data: getSupportList,
        });
    } catch (e) {
        return response.status(500).json({
            status: false,
            message: "Something Went To Wrong",
            data: null,
        });
    }
};

module.exports.getSupport = async (request, response, next) => {
    try {
        const { id } = request.params;
        const { user } =  request.body;

        const checkAdmin = await AdminModel.findOne({
            _id: user._id,
            role: "ADMIN",
            isDeleted: false
        });

        if(!checkAdmin) {
            return response.status(409).json({
              status: false,
              message: "You are not Admin",
              data: null,
            });
        }

        const getSupportList = await SupportModel.findOne({
            _id: id,
        }).populate({
            path: "user",
            select: "userName name email profileImage",
        });

        if (!getSupportList) {
            return response.status(400).json({
                status: false,
                message: "Enter valid id",
                data: null,
            });
        }

        const imageUrls = await Promise.all(
            getSupportList.image.map(async (imageName) => {
                const blobClient = containerClient.getBlobClient(imageName);
                const blobExists = await blobClient.exists();

                if (blobExists) {
                    return blobClient.url;
                }
            })
        );

        return response.json({
            status: true,
            message: "Ticket Details Get successfully",
            data: {
                ...getSupportList.toObject(),
                image: imageUrls.filter(Boolean),
            },
        });
    } catch (e) {
        return response.status(500).json({
            status: false,
            message: "Something Went To Wrong",
            data: null,
        });
    }
};

module.exports.getTokenId = async (request, response, next) => {
    try {
        const { id } = request.params;
        const { user } = request.body;

        const checkAdmin = await AdminModel.findOne({
            _id: user._id,
            role: "ADMIN",
            isDeleted: false
        });

        if(!checkAdmin) {
            return response.status(409).json({
              status: false,
              message: "You are not Admin",
              data: null,
            });
        }

        const getSupportList = await SupportModel.findOne({
            tokenId: id,
        }).populate({
            path: "user",
            select: "userName name email profileImage",
        });

        if (!getSupportList) {
            return response.status(400).json({
                status: false,
                message: "Enter valid token ID",
                data: null,
            });
        }

        const imageUrls = await Promise.all(
            getSupportList.image.map(async (imageName) => {
                const blobClient = containerClient.getBlobClient(imageName);
                const blobExists = await blobClient.exists();

                if (blobExists) {
                    return blobClient.url;
                }
            })
        );

        return response.json({
            status: true,
            message: "Support Get successfully",
            data: {
                ...getSupportList.toObject(),
                image: imageUrls.filter(Boolean),
            },
        });
    } catch (e) {
        return response.status(500).json({
            status: false,
            message: "Something Went To Wrong",
            data: null,
        });
    }
};

module.exports.adminMessage = async (request, response, next) => {
    try {
        const { id } = request.params;
        const { user, message } = request.body;

        const checkAdmin = await AdminModel.findOne({
            _id: user._id,
            isDeleted: false,
            role: "ADMIN",
        });

        if(!checkAdmin) {
            return response.status(409).json({
              status: false,
              message: "You are not Admin",
              data: null,
            });
        }

        const updateSupportMessage = await SupportModel.findOneAndUpdate(
            {
                _id: id,
            },
            {
                $push: {
                    thread: { message },
                },
            },
            {
                $new: true,
            },
        );
        if (!updateSupportMessage) {
            return response.status(400).json({
                status: false,
                message: "Error while sending message",
                data: null,
            });
        }
        return response.json({
            status: true,
            message: "Message sent Successfully",
            data: message,
        });
    } catch (e) {
        return response.status(500).json({
            status: false,
            message: "Something went Wrong",
            data: null,
        });
    }
};
