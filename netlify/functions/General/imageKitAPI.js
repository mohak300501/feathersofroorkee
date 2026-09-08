const ImageKit = require('@imagekit/nodejs');

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.VITE_IMAGEKIT_URL_ENDPOINT
});

/**
 * Uploads a file to ImageKit
 * @param {string} fileData - Base64 encoded string or file URL
 * @param {string} fileName - Target file name
 * @returns {Promise<object>} ImageKit upload response
 */
async function uploadFileToImageKit(fileData, fileName, subfolderName) {
  try {
    const folder = subfolderName
      ? `/roorkee/${subfolderName}`
      : '/roorkee';

    const result = await imagekit.files.upload({ file: fileData, fileName, folder });
    return {
      imagekitFileId: result.fileId,
      imagekitFilePath: result.filePath
    };
  } catch (error) {
    console.error("ImageKit upload error:", error);
    throw error;
  }
}

/**
 * Delete file from ImageKit
 * @param {string} fileId - Unique ID of ImageKit file to delete
 * @returns {Promise<void>}
 */
async function deleteFileFromImageKit(fileId) {
  if (!fileId) {
    return;
  }

  try {
    await imagekit.files.delete(fileId);

    console.log('ImageKit file deleted:', fileId);
  } catch (error) {
    console.error('ImageKit delete error:', error);
    throw error;
  }
}

module.exports = { uploadFileToImageKit, deleteFileFromImageKit };
