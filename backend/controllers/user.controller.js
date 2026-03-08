import User from "../models/user.model.js"

// Controller to get the currently logged-in user
// This API is usually called after login or on page refresh
export const getCurrentUser = async (req, res) => {
    try {
        // userId is attached to req object by auth middleware
        // It is extracted from the verified JWT token
        const userId = req.userId

        // If userId is not present, the user is not authenticated
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is not found"
            })
        }

        // Fetch the user details from database using userId
        const user = await User.findById(userId)

        // If no user is found in database
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "user is not found"
            })
        }

        // If user exists, send user data to frontend
        // This helps frontend display profile info
        // and maintain authentication state
        return res.status(200).json({
            success: true,
            message: `${user.fullName} is here!`,
            user
        })

    } catch (error) {
        // Handles unexpected server errors
        return res.status(500).json({
            success: false,
            message: "get current user error"
        })
    }
}


export const updateUserLocation = async (req, res) => {
    try {
        // Extract latitude and longitude from request body
        const { lat, lon } = req.body

        // Update the logged-in user's location using GeoJSON format
        // req.userId comes from auth middleware (verified JWT user)
        const user = await User.findByIdAndUpdate(
            req.userId,
            {
                location: {
                    type: "Point",           // GeoJSON type
                    coordinates: [lon, lat]  // [longitude, latitude] (important order)
                }
            },
            { new: true } // return the updated user document
        )

        // If user does not exist in database
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "user is not found"
            })
        }

        // Location updated successfully
        return res.status(200).json({
            success: true,
            message: "location updated"
        })

    } catch (error) {
        // Handle server / database errors
        return res.status(500).json({
            success: false,
            message: "update location user error"
        })
    }
}



