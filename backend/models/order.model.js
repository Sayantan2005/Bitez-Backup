import mongoose from "mongoose"

/*
------------------------------------
Schema for Individual Order Item
------------------------------------
This represents ONE product inside a shop order.
Example:
If user orders 2 Apples from a shop → this schema stores that item info.
*/
const shopOrderItemSchema = new mongoose.Schema({

    // Reference to the Item/Product collection
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item", // Links this item to Item collection
        required: true
    },

    // Total price of this specific item type
    // Example: If 1 apple = ₹50 and quantity = 2 → price = ₹100
    price: {
        type: Number
    },

    name: String,

    // Quantity of that item ordered
    quantity: {
        type: Number
    }

}, {
    // Automatically adds:
    // createdAt → when item added
    // updatedAt → when item updated
    timestamps: true
})



/*
------------------------------------
Schema for Shop Wise Order
------------------------------------
If user orders from multiple shops,
each shop gets its own order entry.

Example:
User orders from:
- Shop A
- Shop B

Then 2 shopOrder objects will be created.
*/
const shopOrderSchema = new mongoose.Schema({

    // Reference to the Shop from where items are ordered
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shop"
    },

    // Owner of the shop
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    // Subtotal amount of this specific shop order
    // (Sum of all items ordered from this shop)
    subtotal: {
        type: Number
    },

    // List of all items ordered from this shop
    // Uses embedded shopOrderItemSchema
    shopOrderItems: [
        shopOrderItemSchema
    ],
    status: {
        type: String,
        enum: ["pending", "preparing", "out of delivery", "delivered"], // pending , preparing, out of delivery can be changed by owner and delivered status can be changed by the delivery boy 
        default: "pending"
    },

    /*
   NOTE:
   Delivery is handled per shop, not per entire order.
   Since one order can contain items from multiple shops,
   each shopOrder needs its own delivery lifecycle.
   
   The `assignment` field links a shopOrder to its
   DeliveryAssignment, allowing:
   - different delivery boys per shop
   - independent delivery status tracking
   - clean separation of order and delivery logic
   
   This field remains null until the shop owner marks
   the order as "out for delivery".
   */
    assignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DeliveryAssignment",
        default: null
    },
    assignedDeliveryBoy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    deliveryOtp: {
        type: String,
        default: null
    },

    otpExpires: {
        type: Date
    },
    deliveredAt:{
        type:Date,
        default:null
    },





}, {
    timestamps: true
})



/*
------------------------------------
Main Order Schema
------------------------------------
Represents complete order placed by user.

One main order can contain:
- Multiple shop orders
*/
const orderSchema = new mongoose.Schema({

    // User who placed the order
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // Payment method chosen by user
    // Only 2 values allowed
    paymentMethod: {
        type: String,
        enum: ['cod', 'online'], // cod = Cash on Delivery
        required: true
    },

    // Delivery address of the user
    deliveryAddress: {
        text: String,        // Full address text
        latitude: Number,    // GPS latitude
        longitude: Number   // GPS longitude
    },

    // Total amount of the entire order
    // (Sum of all shop orders)
    totalAmount: {
        type: Number
    },

    /*
    When user orders from multiple shops,
    each shop order is stored inside this array.
    */
    shopOrders: [
        shopOrderSchema
    ],
    
  payment: {
    type: Boolean,
    default: false
    // Indicates the payment status of the order.
    // false → Payment is pending / not completed
    // true  → Payment has been successfully completed
},

razorpayOrderId: {
    type: String,
    default: ""
    // Stores the Razorpay Order ID created from the backend.
    // This ID is generated when you create an order using Razorpay Orders API.
    // Example: order_Nf8h32ksjdf93
    // Used to link your database order with Razorpay order.
},

razorpayPaymentId: {
    type: String,
    default: ""
    // Stores the Razorpay Payment ID received after successful payment.
    // Example: pay_Nf9skd83kshf7
    // Used for verifying and tracking the completed payment.
}

}, {
    timestamps: true
})


const Order = mongoose.model("Order", orderSchema)
export default Order