// Import Cloudinary v2 SDK and rename it as cloudinary
// v2 is the latest and recommended version of Cloudinary API
import { v2 as cloudinary } from 'cloudinary'

// Import Node.js File System module
// Used here to delete the file from local storage after upload
import fs from "fs"

// Function to upload a file to Cloudinary
// `file` is the local file path (usually provided by Multer)
const uploadOnCloudinary = async (file) => {

    // Configure Cloudinary using credentials stored in environment variables
    // This keeps sensitive information secure and out of source code
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Cloudinary account name
        api_key: process.env.CLOUDINARY_API_KEY,       // API key
        api_secret: process.env.CLOUDINARY_API_SECRET  // API secret
    });

    try {
        // Upload the file to Cloudinary
        // Cloudinary automatically detects file type (image, video, etc.)
        const result = await cloudinary.uploader.upload(file)

        // Log the complete upload response (useful for debugging)
        console.log(result)

        // Delete the file from local storage after successful upload
        // This prevents unnecessary disk space usage on the server
        fs.unlinkSync(file)

        // Return the secure HTTPS URL of the uploaded file
        return result.secure_url
        
    } catch (error) {

        // If upload fails, still remove the file from local storage
        // to avoid leftover temporary files
        fs.unlinkSync(file)

        // Log the error for debugging purposes
        console.log(error)
    }
}

// Export the function so it can be used in other files
export default uploadOnCloudinary
