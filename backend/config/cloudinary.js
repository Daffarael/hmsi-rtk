const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

/**
 * Upload buffer to Cloudinary
 * @param {Buffer} buffer - Buffer file dari multer memoryStorage
 * @param {Object} options - Opsi upload Cloudinary (folder, quality, format, dll)
 * @returns {Promise<Object>} Hasil upload Cloudinary
 */
const uploadBufferToCloudinary = (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const defaultOptions = {
            folder: 'hmsi-rtk/piket',
            resource_type: 'image',
            quality: 'auto',
            fetch_format: 'auto'
        };

        const stream = cloudinary.uploader.upload_stream(
            { ...defaultOptions, ...options },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        stream.end(buffer);
    });
};

module.exports = {
    cloudinary,
    uploadBufferToCloudinary
};

