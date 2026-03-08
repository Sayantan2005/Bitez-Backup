import mongoose from "mongoose";
import { type } from "os";

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        // required:true ---> becuase we also use google sign in so we dont set required
    },
    mobile: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["user", "owner", "deliveryBoy"], //only this 3 role is avaialable
        required: true
    },
    //for password reset we modified my user model
    resetOtp: {
        type: String
    },
    isOtpVerified: {
        type: Boolean,
        default: false
    },
    otpExpires: {
        type: Date
    },

    // Each user will have a unique socketId
    // This socketId is generated automatically by Socket.IO 
    // when the user connects to the server

    // We store this socketId in the database so that:
    // 1️⃣ We can send real-time events to a specific user
    // 2️⃣ We can track if the user is online
    // 3️⃣ We can notify that exact user (private message, order update, etc.)

    socketId: {
        type: String   // Stores the unique socket connection ID
    },
    // is the delivery boy online or not if the user is not online then dont show in available delivery boys 
    isOnline: {
        type: Boolean,
        default: false
    },

    // Location details of the user / delivery boy
    // Stored in GeoJSON format so MongoDB can do geospatial queries
    location: {

        // GeoJSON type → always "Point" for a single location
        type: {
            type: String,
            enum: ['Point'], // restricts value to only "Point"
            default: "Point"
        },

        // Coordinates array following GeoJSON order
        // [longitude, latitude] → NOT latitude first
        coordinates: {
            type: [Number],  // [lng, lat]
            default: [0, 0], // fallback location if not provided
        }
    }

},
    { timestamps: true })

// Create a geospatial index on the location field
// "2dsphere" index is required for GeoJSON data
// Enables geospatial queries like:
// - find nearby users / delivery boys
// - calculate distance between points
// - use $near, $geoWithin, etc.
userSchema.index({
    location: '2dsphere'
})


const User = mongoose.model("User", userSchema)

export default User