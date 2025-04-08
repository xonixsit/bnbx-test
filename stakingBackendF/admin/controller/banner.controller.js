const AdminModel = require("../../models/users.model");
const BannerModel = require("../../models/banner.model");
const EventModel = require("../../models/event.model");
const { BlobServiceClient } = require('@azure/storage-blob');
const config = require("../../config/config");
const fs = require("fs");

async function uploadFileToBlob(blockBlobClient, filePath) {
    const stream = fs.createReadStream(filePath);
    const uploadOptions = {
      bufferSize: 4 * 1024 * 1024, // 4 MB chunks
      maxBuffers: 5, // Up to 20 MB in total
    };
    await blockBlobClient.uploadStream(
      stream,
      uploadOptions.bufferSize,
      uploadOptions.maxBuffers
    );
}

module.exports.uploadBanner = async (request, response, next) => {
    try {
        const { user } = request.body;
        const { title } = request.query;

        const checkAdmin = await AdminModel.findOne({
            _id: user._id,
            isDeleted: false,
            role: "ADMIN",
        });

        if (!checkAdmin) {
            return response.status(409).json({
                status: false,
                message: "You are not Admin",
                data: null,
            });
        }

        if(!request.files || Object.keys(request.files).length === 0){
            return response.status(401).json({
                status: false,
                message: "Please upload file",
                data: null,
            });
        };

        const blobServiceClient = BlobServiceClient.fromConnectionString(config.BLOB_CONNECTING_STRING);
        
        // Get a reference to the container
        const containerClient = blobServiceClient.getContainerClient(config.BLOB_BANNER_CONTAINER);

        // Get the uploaded files
        const banner = request.files["banner"][0];

        // Create unique names for the blobs using the original file names
        const bannerBlobName = `${Date.now()}-${banner.originalname}`;

        const bannerBlockBlobClient = containerClient.getBlockBlobClient(bannerBlobName);

        await uploadFileToBlob(bannerBlockBlobClient, banner.path);
    
        const bannerData = await BannerModel.create({
            title: title,
            bannerImage:bannerBlobName 
        });

        fs.unlinkSync(banner.path);
        
        return response.status(400).json({
            status: false,
            message: "banner upload success",
            data: bannerData,
        });
            
    } catch (error) {
        return response.status(500).json({
            status: false,
            message: "Something went wrong",
            data: null,
        });
    }
};

module.exports.getBanner = async (request, response) => {
    try {
        const { user } = request.body;

        const checkAdmin = await AdminModel.findOne({
            _id: user._id,
            isDeleted: false,
            role: "ADMIN",
        });

        if (!checkAdmin) {
            return response.status(403).json({
                status: false,
                message: "You are not Admin",
                data: null,
            });
        }

        const banner = await BannerModel.findOne({
            isDeleted: false,
            fileType: "IMAGE"
        }).sort({ createdAt: -1 });
        
        if (!banner) {
            return response.status(404).json({
                status: false,
                message: "Banner not found",
                data: null,
            });
        }

        const connectionString = config.BLOB_CONNECTING_STRING;
        const containerName = config.BLOB_BANNER_CONTAINER;

        // Create a blob service client
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

        // Get a reference to the container
        const containerClient = blobServiceClient.getContainerClient(containerName);

        // Retrieve URLs for each banner
        // const bannerUrls = await Promise.all(
        //     bannerList.map(async (banner) => {
        //         const blobUrl = containerClient.getBlobClient(banner.bannerImage).url;
        //         banner.bannerImage = blobUrl;
        //         return {  banner };
        //     })
        // );
        const blobUrl = containerClient.getBlobClient(banner.bannerImage).url;
        banner.bannerImage = blobUrl;

        return response.status(200).json({
            status: true,
            message: "Banner list retrieved successfully",
            data: banner,
        });
    } catch (error) {
        response.status(500).json({
            status: false,
            message: "Failed to retrieve banners",
            data: null,
        });
    }
};

module.exports.deleteBanner = async (request, response) => {
    try {
        const { user, bannerId } = request.body;

        const checkAdmin = await AdminModel.findOne({
            _id: user._id,
            isDeleted: false,
            role: "ADMIN",
        });

        if (!checkAdmin) {
            return response.status(403).json({
                status: false,
                message: "You are not Admin",
                data: null,
            });
        }

        const bannerData = await BannerModel.findOne({
            _id: bannerId,
            isDeleted: false,
        });

        if (!bannerData) {
            return response.status(404).json({
                status: false,
                message: "Banner not found or deleted",
                data: null,
            });
        }

        bannerData.isDeleted = true;
        bannerData.save();

        return response.status(200).json({
            status: true,
            message: "Banner Deleted successfully",
            data: bannerData,
        });
    } catch (error) {
        response.status(500).json({
            status: false,
            message: "Failed to delete banner",
            data: null,
        });
    }
};

module.exports.uploadExcel = async (request, response, next) => {
    try {
        const { user } = request.body;
        const { title } = request.query;

        if (user.role != "ADMIN") {
            return response.status(409).json({
                status: false,
                message: "You are not Admin",
                data: null,
            });
        }

        if(!request.files || Object.keys(request.files).length === 0){
            return response.status(401).json({
                status: false,
                message: "Please upload file",
                data: null,
            });
        };

        const blobServiceClient = BlobServiceClient.fromConnectionString(config.BLOB_CONNECTING_STRING);
        
        // Get a reference to the container
        const containerClient = blobServiceClient.getContainerClient(config.BLOB_BANNER_CONTAINER);

        // Get the uploaded files
        const banner = request.files["excel"][0];

        // Create unique names for the blobs using the original file names
        const bannerBlobName = `${Date.now()}-${banner.originalname}`;

        const bannerBlockBlobClient = containerClient.getBlockBlobClient(bannerBlobName);

        await uploadFileToBlob(bannerBlockBlobClient, banner.path);
    
        const bannerData = await BannerModel.create({
            title: title,
            excelFile: bannerBlobName,
            fileType: "EXCEL"
        });

        fs.unlinkSync(banner.path);
        
        return response.status(400).json({
            status: false,
            message: "Excel upload success",
            data: bannerData,
        });
            
    } catch (error) {
        return response.status(500).json({
            status: false,
            message: "Something went wrong",
            data: null,
        });
    }
};

module.exports.getExcel = async (request, response) => {
    try {
        const { user } = request.body;

        if (user.role != "ADMIN") {
            return response.status(409).json({
                status: false,
                message: "You are not Admin",
                data: null,
            });
        }

        const bannerList = await BannerModel.find({
            isDeleted: false,
            fileType: "EXCEL"
        });

        if (!bannerList || bannerList.length === 0) {
            return response.status(404).json({
                status: false,
                message: "Excel sheet not found",
                data: null,
            });
        }

        const connectionString = config.BLOB_CONNECTING_STRING;
        const containerName = config.BLOB_BANNER_CONTAINER;
        
        // Create a blob service client
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        
        // Get a reference to the container
        const containerClient = blobServiceClient.getContainerClient(containerName);
       
        // Retrieve URLs for each banner
        const bannerUrls = await Promise.all(
            bannerList.map(async (banner) => {
                const blobUrl = containerClient.getBlobClient(banner.excelFile).url;
                banner.excelFile = blobUrl
                return { excel: banner };
            })
        );

        return response.status(200).json({
            status: true,
            message: "Excel sheet retrieved successfully",
            data: bannerUrls,
        });
    } catch (error) {
        response.status(500).json({
            status: false,
            message: "Failed to retrieve banners",
            data: null,
        });
    }
};

module.exports.createEvent = async (request, response) => {
    try {
        const { user, title, message, url } = request.body;

        if (user.role != "ADMIN") {
            return response.status(409).json({
                status: false,
                message: "You are not Admin",
                data: null,
            });
        }

        const eventData = await EventModel.create({
            title,
            message,
            url
        });

        return response.status(200).json({
            status: true,
            message: "Event created successfully",
            data: eventData,
        });
    } catch (error) {
        response.status(500).json({
            status: false,
            message: "Failed to create Event",
            data: null,
        });
    }
};

module.exports.getEvent = async (request, response) => {
    try {
        const { user } = request.body;

        if (user.role != "ADMIN") {
            return response.status(409).json({
                status: false,
                message: "You are not Admin",
                data: null,
            });
        }

        const eventData = await EventModel.findOne({
            isDeleted: false,
        }).sort({ createdAt: -1 });

        return response.status(200).json({
            status: true,
            message: "Event created successfully",
            data: eventData,
        });
    } catch (error) {
        response.status(500).json({
            status: false,
            message: "Failed to create Event",
            data: null,
        });
    }
};