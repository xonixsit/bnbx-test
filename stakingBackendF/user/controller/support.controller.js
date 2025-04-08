const SupportModel = require("../../models/support.model.js");
const UserModel = require("../../models/users.model");
const { BlobServiceClient } = require('@azure/storage-blob');
const config = require("../../config/config");
const blobServiceClient = BlobServiceClient.fromConnectionString(config.BLOB_CONNECTING_STRING);
const containerClient = blobServiceClient.getContainerClient(config.BLOB_SUPORT_CONTAINER);
const streamifier = require('streamifier');

// module.exports.addSupport = async (request, response, next) => {
//     try {
//         const { user, desc, type, title } = request.body;

//         const tokenId = generateToken();
//         const insertData = {
//             user: user._id,
//             desc,
//             type,
//             title,
//             tokenId,
//         };
   
//         const addNewSupport = await SupportModel.create(insertData);

//         if (!addNewSupport) {
//             return response.status(400).json({
//                 status: false,
//                 message: "Error While Add Support",
//                 data: null,
//             });
//         }
//         return response.json({
//             status: true,
//             message: "Support Add successfully",
//             data: addNewSupport,
//         });
//     } catch (e) {
//         console.log(
//             "%c 🥧 e: ",
//             "font-size:20px;background-color: #3F7CFF;color:#fff;",
//             e,
//         );
//         return response.status(500).json({
//             status: false,
//             message: "Something Went To Wrong",
//             data: null,
//         });
//     }
// };

module.exports.deleteSupport = async (request, response, next) => {
    try {
        const { id } = request.params;
        const { user } = request.body;

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
            message: "Support Delete successfully",
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
        const options = {
            page,
            limit: sizePerPage,
            sort: { createdAt: 1 },
        };
        let query = { isDeleted: false, user: user._id };
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
        const getSupportList = await SupportModel.paginate(query, options);

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

        const getSupportList = await SupportModel.findOne({
            _id: id,
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

module.exports.updateSupport = async (request, response, next) => {
    try {
        const { id } = request.params;
        const { status } = request.body;

        const updateSupportStatus = await SupportModel.findOneAndUpdate(
            {
                _id: id,
            },
            {
                $set: { status },
            },
            {
                new: true,
            },
        ).populate({
            path: "user",
            select: "userName name email profileImage",
        });

        if (!updateSupportStatus) {
            return response.status(400).json({
                status: false,
                message: "Enter valid id",
                data: null,
            });
        }

        const imageUrls = await Promise.all(
            updateSupportStatus.image.map(async (imageName) => {
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
                ...updateSupportStatus.toObject(),
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

module.exports.userMessage = async (request, response, next) => {
    try {
        const { id } = request.params;
        const { message } = request.body;

        const support = await SupportModel.findById(id);
        if (!support) {
            return response.status(404).json({
                status: false,
                message: 'Enter valid id',
                data: null,
            });
        }

        // Get the latest thread
        const latestThread = support.thread[support.thread.length - 1];

        // Add the user's message to the reply array in the latest thread
        latestThread.reply.push({
            message,
        });

        // Save the updated support document
        const updatedSupport = await support.save();

        // Retrieve image URLs from Blob storage
        const imageUrls = await Promise.all(
            updatedSupport.image.map(async (imageName) => {
                const blobClient = containerClient.getBlobClient(imageName);
                const blobExists = await blobClient.exists();

                if (blobExists) {
                    return blobClient.url;
                }
            })
        );

        return response.json({
            status: true,
            message: 'Reply sent successfully',
            data: {
                ...updatedSupport.toObject(),
                image: imageUrls.filter(Boolean),
            },
        });
    } catch (error) {
        console.log(error);
        return response.status(500).json({
            status: false,
            message: 'Something went wrong',
            data: null,
        });
    }
};
  
function generateToken(){
    let timestamp = Date.now().toString();
    let random = Math.floor(Math.random() * 100000).toString(); 
    return timestamp + random;      
}

const getBlobName = (originalName) => {
    const identifier = Math.random().toString().replace(/0\./, ''); // remove "0." from start of string
    return `${identifier}-${originalName}`;
};

module.exports.addSupport = async(request, response, next) => {
    try {
        const { type, desc, title } = request.query;
        const { user } = request.body;

        const userData = await UserModel.findOne({
            _id: user._id,
            isDeleted: false,
        });

        if(!userData){
            return response.status(401).json({
                status: false,
                message: "User Not Found or deleted",
                data: null,
            });
        };

        if(!request.files || Object.keys(request.files).length === 0){
            return response.status(401).json({
                status: false,
                message: "Please upload file",
                data: null,
            });
        };

        if(request.files.length > 2){
            return response.status(401).json({
                status: false,
                message: "You can upload max 2 image",
                data: null,
            }); 
        }

        const uploadPromises = [];
        const imageName = []

        request.files.forEach((file) => {
            const blobName = getBlobName(file.originalname);
            imageName.push(blobName)
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);
            const stream = streamifier.createReadStream(file.buffer);
            const streamLength = file.buffer.length;
        
            const uploadPromise = blockBlobClient.uploadStream(stream, streamLength);
            uploadPromises.push(uploadPromise);
        });

        const tokenId = generateToken();
        const insertData = {
            user: user._id,
            desc,
            type,
            title,
            tokenId,
            image: imageName,
        };

        const addNewSupport = await SupportModel.create(insertData);

        Promise.all(uploadPromises)
        .then(() => {
            return response.status(200).json({
                status: true,
                message: "submit successfully",
                data: addNewSupport,
            });
        })
        .catch((err) => {
            return response.status(400).json({
                status: false,
                message: "Error While sending support message",
                data: err,
            });
        });
    } catch (error) {
        return response.status(500).json({
            status: false,
            message: "Something went wrong",
            data: null,
        });
    }
};