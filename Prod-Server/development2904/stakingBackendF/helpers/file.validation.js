var path = require("path");

exports.fileValidation = (file) => {
    var allowedExtensions = [".jpg", ".jpeg", ".png"]; //add as per requirements
    var fileExtension = path.extname(file.name);
    if (!allowedExtensions.includes(fileExtension)) {
        return { status: false, message: "invalid file type" };
    }
    if (file.size > 9 * 1024 * 1024) {
        //9 mb limit
        return { status: false, message: "file size is to large" };
    }
    return { status: true };
};