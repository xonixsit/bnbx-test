const EventModel = require("../../models/event.model");
const BannerModel = require("../../models/banner.model");

module.exports.getBanner = async (request, response) => {
    try {
        const { user } = request.body;

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

        // const connectionString = config.BLOB_CONNECTING_STRING;
        // const containerName = config.BLOB_BANNER_CONTAINER;

        // // Create a blob service client
        // const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

        // // Get a reference to the container
        // const containerClient = blobServiceClient.getContainerClient(containerName);

        // Retrieve URLs for each banner
        // const bannerUrls = await Promise.all(
        //     bannerList.map(async (banner) => {
        //         const blobUrl = containerClient.getBlobClient(banner.bannerImage).url;
        //         return { id: banner._id, url: blobUrl };
        //     })
        // );
        // const blobUrl = containerClient.getBlobClient(banner.bannerImage).url;
        // banner.bannerImage = blobUrl;

        return response.status(200).json({
            status: true,
            message: "Banner list retrieved successfully",
            data: "banner",
        });
    } catch (error) {
        response.status(500).json({
            status: false,
            message: "Failed to retrieve banners",
            data: null,
        });
    }
};

module.exports.getEventNotification = async (request, response) => {
    try {
        const { user } = request.body;

        const event = await EventModel.findOne({
            isDeleted: false,
        }).sort({ createdAt: -1 });

        if(!event){
            return response.status(404).json({
                status: true,
                message: "Event not found",
                data: "",
            });
        }

        return response.status(200).json({
            status: true,
            message: "Current Event",
            data: event,
        });
    } catch (error) {
        response.status(500).json({
            status: false,
            message: "Failed to retrieve Event.",
            data: null,
        });
    }
};