import mongoose from "mongoose";

const deliveryAssignmentSchema = new mongoose.Schema({

    // Reference to the main order document
    // Helps link delivery details with the original order
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    },

    // Shop from where the order will be picked up
    // Useful for shop-wise delivery tracking
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shop"
    },

    // ID of the specific shopOrder inside order.shopOrders array
    // Required because one order can contain items from multiple shops
    shopOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    // After the owner changes status to "out for delivery",
    // notifications are broadcasted to nearby delivery boys

    // Delivery boys who received the broadcast notification
    // Used to track who was notified
    broadcastedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],

    // Delivery boy who accepted and got assigned the order
    // Remains null until someone accepts
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    // Current delivery assignment status
    // broadcasted → assigned → completed
    status: {
        type: String,
        enum: ["broadcasted", "assigned", "completed"],
        default: "broadcasted"
    },

    // Timestamp when the delivery boy accepted the order
    // Useful for analytics and tracking delays
    acceptedAt: Date

}, { timestamps: true }) // Automatically adds createdAt & updatedAt

// Create DeliveryAssignment model
const DeliveryAssignment = mongoose.model(
    "DeliveryAssignment",
    deliveryAssignmentSchema
)

export default DeliveryAssignment
