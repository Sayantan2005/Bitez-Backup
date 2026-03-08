// Import Multer middleware for handling multipart/form-data (file uploads)
import multer from "multer"

// Configure storage settings for Multer
const storage = multer.diskStorage({

    // destination determines where uploaded files will be stored on the server
    // req  → request object
    // file → uploaded file object
    // cb   → callback function
    destination: (req, file, cb) => {
        // Save uploaded files inside the "public" folder
        // NOTE: This path should exist, otherwise upload will fail
        cb(null, "./public")
    },

    // filename determines the name of the file when saved on disk
    filename: (req, file, cb) => {
        // Save file using its original name
        // This keeps the uploaded file name unchanged
        cb(null, file.originalname)
    }
})

// Create Multer upload middleware using the defined storage configuration
// This middleware will be used in routes to handle file uploads
export const upload = multer({ storage })
