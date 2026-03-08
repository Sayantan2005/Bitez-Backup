import Item from "../models/item.model.js";
import Shop from "../models/shop.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

export const addItem = async (req, res) => {
  try {
    const { name, category, foodType, price } = req.body

    if (!name || !category || !foodType || !price) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      })
    }

    let image;

    // Upload image and store ONLY the URL
    if (req.file) {
      image = await uploadOnCloudinary(req.file.path)
    }

    // Find shop
    const shop = await Shop.findOne({ owner: req.userId })

    if (!shop) {
      return res.status(400).json({
        message: "Shop not found"
      })
    }

    // Create item
    const item = await Item.create({
      name,
      category,
      foodType,
      price,
      image,
      shop: shop._id
    })

    // ✅ IMPORTANT: Update shop with new item
    shop.items.push(item._id)
    await shop.save()
    await shop.populate("items owner")

    // ✅ Return UPDATED shop
    const updatedShop = await Shop.findById(shop._id).populate({
      path: "items",
      options: { sort: { updatedAt: -1 } }
    })

    return res.status(201).json({
      success: true,
      message: "Item added successfully",
      shop: updatedShop
    })

  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: "Add item error"
    })
  }
}



// Controller of edit a single item becuase a shop contains multiple items so take the id of the item in the params

// Controller to edit/update an existing item
export const editItem = async (req, res) => {
  try {
    // Extract item ID from URL parameters
    const itemId = req.params.itemId

    // Extract updated item fields from request body
    const { name, category, foodType, price } = req.body

    // Variable to store updated image URL (if uploaded)
    let image

    // If a new image is uploaded, send it to Cloudinary
    if (req.file) {
      // ❗ await is REQUIRED here
      image = await uploadOnCloudinary(req.file.path)
    }

    // Update item using its ID
    // { new: true } returns the updated document
    const item = await Item.findByIdAndUpdate(
      itemId,
      {
        name,
        category,
        foodType,
        price,
        ...(image && { image }) // update image only if a new one is uploaded
      },
      { new: true }
    )

    // If item does not exist
    if (!item) {
      return res.status(404).json({
        message: "Item not found"
      })
    }

    // Find the shop that belongs to the currently logged-in owner
    // req.userId is usually set by authentication middleware (JWT / session)
    const shop = await Shop.findOne({ owner: req.userId })

      // Populate the "items" field (which stores item ObjectIds)
      // This replaces item IDs with full item documents
      .populate({
        path: "items",

        // Sort populated items by last updated time
        // -1 means descending order (latest updated item comes first)
        options: { sort: { updatedAt: -1 } }
      });

    // Send success response with updated item
    return res.status(200).json(

      shop
    )

  } catch (error) {
    // Handle server or database errors
    return res.status(500).json({
      message: "Edit item error"
    })
  }
}

// get the item id
export const getItemById = async (req, res) => {
  try {
    const itemId = req.params.itemId
    const item = await Item.findById(itemId)
    if (!item) {
      return res.status(400).json({ message: "item not found" })
    }
    return res.status(200).json(item)
  } catch (error) {
    return res.status(500).json({ message: "get item error" })
  }
}

// Delete a food item controller
export const deleteItem = async (req, res) => {
  try {
    // Extract itemId from URL params
    const itemId = req.params.itemId;

    // 1️⃣ Delete the item from the Item collection
    const item = await Item.findByIdAndDelete(itemId);

    // If item does not exist, return error
    if (!item) {
      return res.status(400).json({ message: "Item not found" });
    }

    // 2️⃣ Find the shop of the currently logged-in owner
    // req.userId is set by auth middleware
    const shop = await Shop.findOne({ owner: req.userId });

    // 3️⃣ Remove (pull) the deleted item ID from shop.items array
    // shop.items contains ObjectIds of items
    shop.items = shop.items.filter(
      (i) => i._id.toString() !== item._id.toString()
    );

    // Save updated shop document
    await shop.save();

    // 4️⃣ Populate the items array again
    // This converts item ObjectIds into full item documents
    // and sorts them by latest updated item first
    await shop.populate({
      path: "items",
      options: { sort: { updatedAt: -1 } }
    });

    // 5️⃣ Send updated shop with populated items back to frontend
    return res.status(200).json(shop);

  } catch (error) {
    return res.status(500).json({ message: "Delete item error" });
  }
};


// get all items which are available in my city

// Controller function to get all items available in a specific city
export const getItemByCity = async (req, res) => {
  try {
    // Extract city parameter from URL (e.g., /items/Kolkata)
    const { city } = req.params;

    // If city is not provided, return bad request
    if (!city) {
      return res.status(400).json({ message: "city is required" });
    }

    // Find all shops whose city matches the given city
    // ^city$  → exact match
    // "i"     → case-insensitive (Kolkata, kolkata, KOLKATA)
    const shops = await Shop.find({
      city: { $regex: new RegExp(`^${city}$`, "i") }
    }).populate("items"); // populate items linked to each shop

    // If no shops found, return error
    if (!shops || shops.length === 0) {
      return res.status(400).json({ message: "shops not found" });
    }

    // Extract only shop IDs from the shop documents
    const shopIds = shops.map((shop) => shop._id);

    // Find all items whose shop field matches any of the shop IDs
    // $in → checks if shop ID exists inside shopIds array
    const items = await Item.find({
      shop: { $in: shopIds }
    });

    // Send all matching items as response
    return res.status(200).json(items);

  } catch (error) {
    // Handle unexpected server errors
    return res.status(500).json({ message: "get item by city error" });
  }
};


// for find items which belongs to a particular shop

// Controller to get all items of a specific shop
export const getItemsByShop = async (req, res) => {
  try {
    // Extract shopId from request parameters (URL)
    const { shopId } = req.params;

    // Find the shop by its ID
    // Populate the "items" field to fetch full item documents
    const shop = await Shop.findById(shopId)
      .populate("items");

    // If shop does not exist, return 400 response
    if (!shop) {
      return res.status(400).json({ message: "Shop not found" });
    }

    // If shop exists, return shop details along with its items
    return res.status(200).json({
      shop,              // Complete shop document
      items: shop.items  // Populated items array
    });

  } catch (error) {
    // If any unexpected error occurs, return 500 server error
    return res.status(500).json({
      message: `Error while getting items by shop ${error}`
    });
  }
};


// now make the searchber interactive
export const searchItems = async (req, res) => {
  try {

    // Extract search text from query string (?query=phone)
    const { query,city } = req.query

    // If search query or city is missing, stop execution
    // (Note: city should be defined or taken from req.query / req.user)
    if (!query || !city) {
      return null
    }

    // Step 1: Find shops in the given city (case-insensitive exact match)
    const shops = await Shop.find({
      city: {
        $regex: new RegExp(
          `^${city}$`,  // ^ = start, $ = end → exact match
          "i"           // case-insensitive flag
        )
      }
    }).populate("items"); // Populate items inside each shop

    // If no shops found
    if (!shops) {
      return res.status(400).json({ message: "shops not found" })
    }

    // Extract shop IDs from the shops array
    const shopIds = shops.map(s => s._id)

    // Step 2: Find items that:
    // 1. Belong to shops in this city
    // 2. Match search query in name OR category
    const items = await Item.find({
      shop: { $in: shopIds },  // $in → item.shop must match any of these shop IDs
      $or: [
        { 
          name: { 
            $regex: query,     // Match search text in item name
            $options: "i"       // case-insensitive
          } 
        },
        { 
          category: { 
            $regex: query,     // Match search text in category
            $options: "i"
          } 
        }
      ]
    }).populate("shop", "name image") // Populate shop details (only name & image)

    // Send matching items as response
    return res.status(200).json(items)

  } catch (error) {

    // Handle unexpected server errors
    return res.status(500).json({
      message: `Search Items error ${error}`
    });

  }
}


// Rating Controller
export const rating = async (req, res) => {
  try {

    // Destructure itemId and rating value from request body
    const { itemId, rating } = req.body

    // Validate required fields
    // If itemId or rating is missing, return 400 Bad Request
    if (!itemId || !rating) {
      return res.status(400).json({
        message: "itemId and rating is required"
      })
    }

    // Validate rating range (must be between 1 and 5)
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "rating must be between 1 to 5"
      })
    }

    // Find the item in database using itemId
    const item = await Item.findById(itemId)

    // If item does not exist, return error
    if (!item) {
      return res.status(400).json({
        message: "item not found"
      })
    }

    // Calculate new rating count
    // Increase previous count by 1
    const newCount = item.rating.count + 1

    // Calculate new average rating
    // Formula:
    // ((oldAverage × oldCount) + newRating) / newCount
    const newAverage =
      (item.rating.average * item.rating.count + rating) / newCount

    // Update item rating fields
    item.rating.count = newCount
    item.rating.average = newAverage

    // Save updated item back to database
    await item.save()

    // Send updated rating as response
    return res.status(200).json({
      rating: item.rating
    })

  } catch (error) {

    // Handle unexpected server errors
    return res.status(500).json({
      message: `rating error ${error}`
    })

  }
}


