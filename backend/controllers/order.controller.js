// Import Order and Shop mongoose models
import DeliveryAssignment from "../models/deliveryAssignment.model.js"
import Order from "../models/order.model.js"
import Shop from "../models/shop.model.js"
import User from "../models/user.model.js"
import { sendDeliveryOTPMail } from "../utils/mail.js"
import Razorpay from "razorpay"
import dotenv from "dotenv"

dotenv.config()

let instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Controller to place a new order
export const placeOrder = async (req, res) => {
  try {
    // Destructure required fields from request body
    const {
      cartItems,
      paymentMethod,
      deliveryAddress,
      totalAmount
    } = req.body

    // Check if cart is empty or not provided
    if (!cartItems || cartItems.length == 0) {
      return res.status(400).json({ message: "Cart is Empty" })
    }

    // Validate delivery address fields
    if (
      !deliveryAddress.text ||
      !deliveryAddress.latitude ||
      !deliveryAddress.longitude
    ) {
      return res.status(400).json({
        message: "Sent complete delivery address"
      })
    }

    // Object to group cart items by shopId
    // Example:
    // {
    //   shopId1: [item1, item2],
    //   shopId2: [item3]
    // }
    const groupItemsByShop = {}

    // Loop through cart items and group them shop-wise
    cartItems.forEach(item => {
      const shopId = item.shop

      // If this shopId is not yet in object, initialize array
      if (!groupItemsByShop[shopId]) {
        groupItemsByShop[shopId] = []
      }

      // Push item into that shop's array
      groupItemsByShop[shopId].push(item)
    })

    // Create orders per shop (multi-vendor order system)
    const shopOrders = await Promise.all(
      Object.keys(groupItemsByShop).map(async (shopId) => {

        // Fetch shop details and populate owner
        const shop = await Shop.findById(shopId).populate("owner")

        // If shop does not exist
        if (!shop) {
          return res.status(400).json({
            message: "Shop not found"
          })
        }

        // Items belonging to this shop
        const items = groupItemsByShop[shopId]

        // Calculate subtotal for this shop
        const subtotal = items.reduce(
          (sum, i) => sum + Number(i.price) * Number(i.quantity),
          0
        )

        // Return formatted shop order
        return {
          shop: shop._id,              // shop reference
          owner: shop.owner._id,       // shop owner reference
          subtotal,                    // total price for this shop
          shopOrderItems: items.map((i) => ({
            item: i.id,              // item id
            price: i.price,          // item price
            quantity: i.quantity,    // quantity ordered
            name: i.name              // item name
          }))
        }
      })
    )

    // Create an order document when user selects Razorpay (online payment)

    if (paymentMethod == "online") {

      // Create a Razorpay order (amount must be in paise → ₹1 = 100)
      const razororder = await instance.orders.create({
        amount: Math.round(totalAmount * 100),
        // Razorpay accepts amount in smallest currency unit (paise)

        currency: 'INR',
        // Currency type

        receipt: `receipt_${Date.now()}`
        // Unique receipt ID for tracking purposes
      })

      // Create order entry in your database
      const newOrder = await Order.create({
        user: req.userId,
        // Logged-in user placing the order

        paymentMethod,
        // "online"

        deliveryAddress,
        // Address where order will be delivered

        totalAmount,
        // Total order amount in rupees

        shopOrders,
        // Items grouped by shop (your custom structure)

        razorpayOrderId: razororder.id,
        // Store Razorpay Order ID for payment verification later

        payment: false
        // Payment not completed yet (will update after verification)
      })

      // Send response to frontend
      return res.status(200).json({
        razororder,
        // Contains order id, amount, currency (used in Razorpay checkout)

        orderId: newOrder._id,
        // Your database order ID

        // key_id: process.env.RAZORPAY_KEY_ID,
        // Public Razorpay Key ID (safe to send to frontend)
      })
    }

    // Create final order document (Cash on Delivery supported)
    const newOrder = await Order.create({
      user: req.userId,          // logged-in user
      paymentMethod,
      deliveryAddress,
      totalAmount,
      shopOrders                 // shop-wise orders
    })

    await newOrder.populate("shopOrders.shopOrderItems.item", "name image price")
    await newOrder.populate("shopOrders.shop", "name")
    await newOrder.populate("shopOrders.owner", "name socketId")
    await newOrder.populate("user", "name email mobile")

    // =============================================

    // Get the Socket.IO server instance from Express app
    // This was probably attached like: app.set('io', io)
    const io = req.app.get('io');

    if (io) { // Make sure the Socket.IO server exists
      // Loop through each shop order in the main order
      // newOrder.shopOrders is an array of orders per shop
      newOrder.shopOrders.forEach(shopOrder => {

        // Get the socket ID of the shop owner for this specific shop
        // This should have been stored earlier when the owner connected
        const ownerSocketId = shopOrder.owner.socketId;

        if (ownerSocketId) { // Make sure the owner is connected
          // Send a real-time event to this specific shop owner
          // 'newOrder' is the event name the client will listen for
          // io.to(socketId).emit() sends to only this socket (not all connected clients)
          io.to(ownerSocketId).emit('newOrder', {
            _id: newOrder._id,                 // Order ID
            paymentMethod: newOrder.paymentMethod, // Payment method (e.g., online/cash)
            user: newOrder.user,               // Customer details
            shopOrders: shopOrder,             // This shop’s order details
            createdAt: newOrder.createdAt,     // Timestamp of the order
            deliveryAddress: newOrder.deliveryAddress, // Delivery location
            payment: newOrder.payment          // Payment status/details
          });
        }
      });
    }

    // ============================================
    // Send success response
    return res.status(201).json(newOrder)

  } catch (error) {
    // Handle unexpected server errors
    return res.status(500).json({
      message: `Place order error ${error}`
    })
  }
}

// Verify the online payment after successful Razorpay checkout

export const verifyPayment = async (req, res) => {
  try {
    console.log("Verify Payment is called")
    // Extract payment ID from Razorpay and your DB order ID from request body
    const { razorpay_payment_id, orderId } = req.body

    // Fetch payment details directly from Razorpay servers
    // This ensures the payment is real and not manipulated from frontend
    const payment = await instance.payments.fetch(razorpay_payment_id)

    // Check if payment exists and is successfully captured
    if (!payment || payment.status != "captured") {
      return res.status(400).json({
        message: "Payment not captured"
      })
    }

    // Find your order in database using orderId
    const order = await Order.findById(orderId)

    // If order not found, return error
    if (!order) {
      return res.status(400).json({
        message: "order not found"
      })
    }

    // Update order payment status to true (payment successful)
    order.payment = true

    // Store Razorpay Payment ID for tracking and record keeping
    order.razorpayPaymentId = razorpay_payment_id

    // Save updated order in database
    await order.save()

    // Populate nested item details inside shopOrders
    // shopOrders → shopOrderItems → item
    await order.populate("shopOrders.shopOrderItems.item", "name image price")

    // Populate shop basic details
    await order.populate("shopOrders.shop", "name")

    await order.populate("shopOrders.owner", "name socketId")
    await order.populate("user", "name email mobile")

    // =============================================

    // Get the Socket.IO server instance from Express app
    // This was probably attached like: app.set('io', io)
    const io = req.app.get('io');

    if (io) { // Make sure the Socket.IO server exists
      // Loop through each shop order in the main order
      // newOrder.shopOrders is an array of orders per shop
      order.shopOrders.forEach(shopOrder => {

        // Get the socket ID of the shop owner for this specific shop
        // This should have been stored earlier when the owner connected
        const ownerSocketId = shopOrder.owner.socketId;

        if (ownerSocketId) { // Make sure the owner is connected
          // Send a real-time event to this specific shop owner
          // 'newOrder' is the event name the client will listen for
          // io.to(socketId).emit() sends to only this socket (not all connected clients)
          io.to(ownerSocketId).emit('newOrder', {
            _id: order._id,                 // Order ID
            paymentMethod: order.paymentMethod, // Payment method (e.g., online/cash)
            user: order.user,               // Customer details
            shopOrders: shopOrder,             // This shop’s order details
            createdAt: order.createdAt,     // Timestamp of the order
            deliveryAddress: order.deliveryAddress, // Delivery location
            payment: order.payment          // Payment status/details
          });
        }
      });
    }

    // Return updated order with populated data
    return res.status(200).json(order)

  } catch (error) {

    // Handle unexpected server errors
    return res.status(500).json({
      message: "Verify Payment Error "
    })
  }
}


// controller to get all orders of a user (normal user and owner)
export const getMyOrders = async (req, res) => {
  try {


    const user = await User.findById(req.userId)
    if (user.role == "user") {
      // Fetch all orders that belong to the currently logged-in user
      const orders = await Order.find({ user: req.userId })

        // Sort orders by creation time (latest orders first)
        .sort({ createdAt: -1 })

        // Populate shop details inside shopOrders array
        // Replaces shop ObjectId with shop document (only name field)
        .populate("shopOrders.shop", "name")

        // Populate owner (user) details of each shop
        // Only name, email, and mobile are returned for security
        .populate("shopOrders.owner", "name email mobile")

        // Populate item details inside shopOrderItems
        // Replaces item ObjectId with item document (name, image, price)
        .populate(
          "shopOrders.shopOrderItems.item",
          "name image price"
        )

      // Send all populated orders to the frontend
      return res.status(200).json(orders)

    } else if (user.role == "owner") {
      // Fetch orders where the logged-in user is the owner of at least one shop
      // "shopOrders.owner" is an array field, so MongoDB matches inside the array
      const orders = await Order.find({
        "shopOrders.owner": req.userId
      })
        // Sort orders by creation time (latest orders first)
        .sort({ createdAt: -1 })

        // Populate shop details inside shopOrders
        // Replaces shop ObjectId with shop document (only name field)
        .populate("shopOrders.shop", "name")

        // Populate the user who placed the order
        // This gives access to customer details
        .populate("user")

        // Populate item details inside each shop order
        // Replaces item ObjectId with item document
        .populate(
          "shopOrders.shopOrderItems.item",
          "name image price"
        )
        .populate(
          "shopOrders.assignedDeliveryBoy",
          "fullName mobile"
        )

      // filter the orders that each owner of the shop get their own orders
      const filteredOrders = orders.map((order => ({
        _id: order._id,
        paymentMethod: order.paymentMethod,
        user: order.user,
        shopOrders: order.shopOrders.find(o => o.owner._id == req.userId),
        createdAt: order.createdAt,
        deliveryAddress: order.deliveryAddress,
        payment: order.payment
      })))

      // Send all populated filtered orders to the frontend
      return res.status(200).json(filteredOrders)
    }

  } catch (error) {
    // Handle server or database errors
    return res.status(500).json({
      message: "Get User Order Error"
    })
  }
}

// update status of order (owner can update status of order)
export const updateOrderStatus = async (req, res) => {
  try {
    // Extract orderId and shopId from URL params
    const { orderId, shopId } = req.params;

    // Extract new status from request body
    const { status } = req.body;

    // Find the main order document by its ID
    const order = await Order.findById(orderId);


    // Find the specific shop's order inside shopOrders array
    const shopOrder = order.shopOrders.find(
      o => o.shop == shopId
    );

    // If no matching shop order is found, return error
    if (!shopOrder) {
      return res.status(400).json({
        message: "Shop order not found",
      });
    }

    // Update the status of that shop's order
    shopOrder.status = status;

    let deliveryBoysPayload = [];

    // // Assign delivery if needed
    if (status === "out of delivery" && !shopOrder.assignment) {

      // Get delivery location from order
      const { longitude, latitude } = order.deliveryAddress;

      // Find delivery boys within 5km radius
      // const nearByDeliveryBoys = await User.find({
      //   role: "deliveryBoy",
      //   location: {
      //     $near: {
      //       $geometry: {
      //         type: "Point",
      //         coordinates: [Number(longitude), Number(latitude)]
      //       },
      //       $maxDistance: 5000,
      //     },
      //   },
      // })

      const nearByDeliveryBoys = await User.find({
        role: "deliveryBoy",
        isOnline: true,
        socketId: { $ne: null },
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [Number(longitude), Number(latitude)]
            },
            $maxDistance: 10000,
          },
        },
      })

      const nearByIds = nearByDeliveryBoys.map(b => b._id);

      // Find busy delivery boys
      const busyIds = await DeliveryAssignment.find({
        assignedTo: { $in: nearByIds },
        status: { $nin: ["broadcasted", "completed"] },
      }).distinct("assignedTo");

      const busyIdSet = new Set(busyIds.map(id => String(id)));

      // Filter available delivery boys
      const availableBoys = nearByDeliveryBoys.filter(
        b => !busyIdSet.has(String(b._id))
      );

      const candidates = availableBoys.map(b => b._id);

      // If no delivery boys available
      if (candidates.length === 0) {
        await order.save();
        return res.json({
          message:
            "Order Status Updated But There is no available delivery boys.",
          availableBoys: [],
        });
      }

      // Create delivery assignment
      const deliveryAssignment = await DeliveryAssignment.create({
        order: order._id,
        shop: shopOrder.shop,
        shopOrderId: shopOrder._id,
        broadcastedTo: candidates,
        status: "broadcasted",
      });

      // Link assignment to shopOrder
      shopOrder.assignedDeliveryBoy = deliveryAssignment.assignedTo;
      shopOrder.assignment = deliveryAssignment._id;


      // Prepare payload for frontend
      deliveryBoysPayload = availableBoys.map((b) => ({
        id: b._id,
        fullName: b.fullName,
        longitude: b.location.coordinates?.[0],
        latitude: b.location.coordinates?.[1],
        mobile: b.mobile,
      }));

      await deliveryAssignment.populate("order")
      await deliveryAssignment.populate("shop")

      // ============================================

      const io = req.app.get("io")
      if (io) {
        availableBoys.forEach(boy => {
          console.log("Boy:", boy._id, "Socket:", boy.socketId)
          const boySocketId = boy.socketId

          if (boySocketId) {
            io.to(boySocketId).emit('newAssignment', {
              sentTo: boy._id,
              assignmentId: deliveryAssignment._id,
              orderId: deliveryAssignment.order._id,
              shopName: deliveryAssignment.shop.name,
              deliveryAddress: deliveryAssignment.order.deliveryAddress,
              items: deliveryAssignment.order.shopOrders
                .find(so => so._id.equals(deliveryAssignment.shopOrderId))
                ?.shopOrderItems || [],


              subtotal: deliveryAssignment.order.shopOrders
                .find(so => so._id.equals(deliveryAssignment.shopOrderId))
                ?.subtotal
            })
          }
        });
      }

      // ===============================================


    }

    // Save changes
    // await shopOrder.save();
    await order.save();

    const updatedShopOrder = order.shopOrders.find(
      o => o.shop == shopId
    );


    // Populate references

    await order.populate("shopOrders.shop", "name");
    await order.populate(
      "shopOrders.assignedDeliveryBoy",
      "fullName email mobile"
    );
    await order.populate(
      "user",
      "socketId"
    );

    // =============================================
    // Get the Socket.IO instance that was stored in Express app
    // (Usually done in server.js using app.set("io", io))
    const io = req.app.get("io");

    // Check if io instance exists (safety check)
    if (io) {

      // Get the socketId of the customer/user who placed the order
      // This assumes socketId is stored in the User model
      const userSocketId = order.user.socketId;

      // Only emit if the user has a valid socketId (means user is online)
      if (userSocketId) {

        // Send real-time status update ONLY to that specific user
        // io.to(socketId) targets a single connected client
        io.to(userSocketId).emit('update-status', {

          // Send the main order id
          orderId: order._id,

          // Send which shop inside the order was updated
          shopId: updatedShopOrder.shop._id,

          // Send the new status (e.g., "Accepted", "Preparing", "Delivered")
          status: updatedShopOrder.status,

          // Send userId (used in frontend to verify correct user)
          userId: order.user._id
        });
      }
    }

    // =============================================



    // return res.status(200).json(shopOrder.status)
    // Send response
    return res.status(200).json({
      shopOrder: updatedShopOrder,
      assignedDeliveryBoy: updatedShopOrder?.assignedDeliveryBoy,
      availableBoys: deliveryBoysPayload,
      assignment: updatedShopOrder?.assignment?._id,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Order Status Error"
    });
  }
};



// if the status is out of delivery then send a notification to delivery boys to assign the order to a delivery boy and who accept the order and after accept a order by a delivery boy then cancel the notification to other delivery boys to further accept the  notification


// the avaialable delivery boys for assignment of order will get the notification of new order and they can accept the order and if any delivery

// Controller to get all broadcasted assignments for a delivery boy
export const getDeliveryBoyAssignment = async (req, res) => {
  try {

    // Get logged-in delivery boy ID from auth middleware
    const deliveryBoyId = req.userId

    // Find assignments where:
    // 1. This delivery boy was broadcasted
    // 2. Status is still "broadcasted" (not accepted yet)
    const assignments = await DeliveryAssignment.find({
      broadcastedTo: deliveryBoyId,
      status: "broadcasted"
    })
      // Populate order details
      .populate("order")

      // Populate shop details
      .populate("shop")

    // Format response data for frontend
    const formated = assignments.map(a => ({

      // Assignment ID
      assignmentId: a._id,

      // Order ID
      orderId: a.order._id,

      // Shop name
      shopName: a.shop.name,

      // Delivery address from order
      deliveryAddress: a.order.deliveryAddress,

      // Get only items related to this specific shopOrder
      // Find matching shopOrder using shopOrderId
      items: a.order.shopOrders
        .find(so => so._id.equals(a.shopOrderId))
        ?.shopOrderItems || [],

      // Subtotal for that particular shop order
      subtotal: a.order.shopOrders
        .find(so => so._id.equals(a.shopOrderId))
        ?.subtotal
    }))

    // Send formatted data to frontend
    return res.status(200).json(formated)

  } catch (error) {

    // Handle server error
    return res.status(500).json({
      message: "get assignment Error"
    });
  }
}


// accept the assigned order by a delivery boy
export const acceptOrder = async (req, res) => {
  try {
    const { assignmentId } = req.params
    const assignment = await DeliveryAssignment.findById(assignmentId)

    if (!assignment) {
      return res.status(400).json({ message: "assignment not found" })
    }

    if (assignment.status != "broadcasted") {
      return res.status(400).json({ message: "assignment is expired" })
    }

    const alreadyAssigned = await DeliveryAssignment.findOne({
      assignedTo: req.userId,
      status: { $nin: ["broadcasted", "completed"] },
    })

    if (alreadyAssigned) {
      return res.status(400).json({
        message: "You are already assigned to another order"
      })
    }

    assignment.assignedTo = req.userId
    assignment.status = 'assigned'
    assignment.acceptedAt = new Date()

    await assignment.save()

    const order = await Order.findById(assignment.order)

    if (!order) {
      return res.status(400).json({
        message: "Order not found"
      })
    }

    // let shopOrder = order.shopOrders.id(assignment.shopOrderId) ---> video solution of error 

    // gpt solution
    const shopOrder = order.shopOrders.find(so => so._id.toString() === assignment.shopOrderId.toString())

    shopOrder.assignedDeliveryBoy = req.userId

    await order.save()

    return res.status(200).json({
      message: "Order Accepted"
    })

  } catch (error) {
    return res.status(500).json({
      message: `accept order Error, ${error}`
    });
  }
}


export const getCurrentOrder = async (req, res) => {
  try {
    const assignment = await DeliveryAssignment.findOne({
      assignedTo: req.userId,
      status: "assigned"
    })
      .populate("shop", "name")
      .populate("assignedTo", "fullName email mobile location")
      .populate({
        path: "order",
        populate: [{
          path: "user",
          select: "fullName , email , location , mobile"
        },
        {
          path: "shopOrders.assignedDeliveryBoy",
          select: "fullName email mobile location"
        }]

      })

    if (!assignment) {
      return res.status(400).json({ message: "assignment not found" })

    }

    if (!assignment.order) {
      return res.status(400).json({
        message: "order not found"
      })
    }

    const shopOrder = assignment.order.shopOrders.find(so => String(so._id) == String(assignment.shopOrderId))

    if (!shopOrder) {
      return res.status(400).json({ message: "shopOrder not found" })
    }

    // now we want to location from delivery boy location to user delivery location

    let deliveryBoyLocation = { lat: null, lon: null }

    if (assignment.assignedTo.location.coordinates.length == 2) {

      deliveryBoyLocation.lat = assignment.assignedTo.location.coordinates[1]
      deliveryBoyLocation.lon = assignment.assignedTo.location.coordinates[0]
    }


    const customerLocation = { lat: null, lon: null }
    if (assignment.order.deliveryAddress) {
      customerLocation.lat = assignment.order.deliveryAddress.latitude
      customerLocation.lon = assignment.order.deliveryAddress.longitude
    }

    return res.status(200).json({
      _id: assignment.order._id,
      user: assignment.order.user,
      shopOrder: shopOrder,
      shopName: assignment.shop?.name,
      deliveryAddress: assignment.order.deliveryAddress,
      deliveryBoyLocation,
      customerLocation
    })

  } catch (error) {
    return res.status(500).json({
      message: `current order Error, ${error}`
    });
  }
}


// for live tracking of a order
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params

    const order = await Order.findById(orderId)

      .populate("user")
      .populate({
        path: "shopOrders.shop",
        model: "Shop"
      })
      .populate({
        path: "shopOrders.assignedDeliveryBoy",
        model: "User"
      })
      .populate({
        path: "shopOrders.shopOrderItems.item",
        model: "Item"
      })
      .lean()

    if (!order) {
      return res.status(400).json({
        message: "Order not Found"
      })
    }

    return res.status(200).json(order)
  } catch (error) {
    return res.status(500).json({
      message: `get by id order Error, ${error}`
    });
  }
}

// after receiving the order a otp will be sent to the customer email and verify the otp

// send the otp
// Controller to generate and send Delivery OTP to the customer
export const sendDeliveryOtp = async (req, res) => {
  try {

    // Extract orderId and shopOrderId from request body
    const { orderId, shopOrderId } = req.body;

    // Find the main order by ID and populate the user details
    const order = await Order.findById(orderId).populate("user");

    // From the order's shopOrders array, find the specific shopOrder by its ID
    const shopOrder = order?.shopOrders.id(shopOrderId);

    // Validate if order or shopOrder exists
    if (!order || !shopOrder) {
      return res.status(400).json({
        message: "Enter valid order/shopOrderId"
      });
    }

    // Generate a random 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Store OTP inside the specific shopOrder
    shopOrder.deliveryOtp = otp;

    // Set OTP expiry time (5 minutes from now)
    shopOrder.otpExpires = Date.now() + 5 * 60 * 1000;

    // Save updated order document
    await order.save();

    // Send OTP to the user's registered email
    await sendDeliveryOTPMail(order.user, otp);

    // Send success response
    return res.status(200).json({
      message: `OTP sent successfully to ${order.user?.fullName}`
    });

  } catch (error) {

    // Catch any unexpected server errors
    return res.status(400).json({
      message: "Delivery OTP error"
    });
  }
};


// verify the OTP
export const verifyDeliveryOTP = async (req, res) => {
  try {
    const { orderId, shopOrderId, otp } = req.body
    // Find the main order by ID and populate the user details
    const order = await Order.findById(orderId).populate("user");

    // From the order's shopOrders array, find the specific shopOrder by its ID
    const shopOrder = order?.shopOrders.id(shopOrderId);

    // Validate if order or shopOrder exists
    if (!order || !shopOrder) {
      return res.status(400).json({
        message: "Enter valid order/shopOrderId"
      });
    }

    if (shopOrder.deliveryOtp !== otp || !shopOrder.otpExpires || shopOrder.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid /Expires OTP" })
    }

    shopOrder.status = "delivered"
    shopOrder.deliveredAt = Date.now()
    await order.save()

    await DeliveryAssignment.deleteOne({
      shopOrderId: shopOrder._id,
      order: order._id,
      assignedTo: shopOrder.assignedDeliveryBoy
    })

    return res.status(200).json({ message: "Ordered Delivered Successfully" })


  } catch (error) {
    // Catch any unexpected server errors
    return res.status(400).json({
      message: "Verify Delivery OTP error"
    });
  }
}

// Controller to calculate how many orders a delivery boy delivered per hour (today)
export const getTodayDeliveries = async (req, res) => {
  try {
    // Get logged-in delivery boy ID (added from auth middleware)
    const deliveryBoyId = req.userId;

    // Create a date object for today's start time (00:00:00)
    const startsOfDay = new Date();
    startsOfDay.setHours(0, 0, 0, 0);

    // Find all orders where:
    // - This delivery boy was assigned
    // - Status is delivered
    // - Delivered today (after 12 AM)
    const orders = await Order.find({
      "shopOrders.assignedDeliveryBoy": deliveryBoyId,
      "shopOrders.status": "delivered",
      "shopOrders.deliveredAt": { $gte: startsOfDay }
    }).lean(); // lean() makes query faster (returns plain JS object)

    // Array to store today's delivered shopOrders only
    let todaysDeliveries = [];

    // Loop through all orders
    orders.forEach(order => {

      
       // Find the delivered shopOrder for this delivery boy
      //  const deliveredShopOrder = order.shopOrders.find(

      // Each order may contain multiple shopOrders
      order.shopOrders.forEach(shopOrder => {

        // Double-check conditions (important because shopOrders is an array)
        if (
          shopOrder.assignedDeliveryBoy == deliveryBoyId &&
          shopOrder.status == "delivered" &&
          shopOrder.deliveredAt &&
          shopOrder.deliveredAt >= startsOfDay
        ) {
          // Push valid delivered shopOrder into array
          todaysDeliveries.push(shopOrder);
        }
      });
    });

    // Object to store delivery count per hour
    // Example: { 10: 2, 11: 3 }
    let stats = {};

    // Loop through today's delivered orders
    todaysDeliveries.forEach(shopOrder => {

      // Extract hour from deliveredAt time
      const hour = new Date(shopOrder.deliveredAt).getHours();
// Increase count for that hour

// stats[hour] → checks if this hour already exists in the object
// If it exists, use its current value
// If it does NOT exist (undefined), use 0 as default value
// Then add 1 to increase delivery count
      stats[hour] = (stats[hour] || 0) + 1;
    });

    // Convert object into array format for frontend
    // Example output:
    // [
    //   { hour: 10, count: 2 },
    //   { hour: 11, count: 3 }
    // ]
    let formattedStats = Object.keys(stats).map(hour => ({
      hour: parseInt(hour),
      count: stats[hour]
    }));

    // Sort by hour in ascending order
    formattedStats.sort((a, b) => a.hour - b.hour);

    // Send final response
    return res.status(200).json(formattedStats);

  } catch (error) {
    return res.status(500).json({
      message: `Today deliveries error ${error}`
    });
  }
};


