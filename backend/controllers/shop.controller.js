import Shop from "../models/shop.model.js"
import uploadOnCloudinary from "../utils/cloudinary.js"

// create a shop
// Controller to CREATE a shop if it does not exist
// OR UPDATE the existing shop of the logged-in user
export const createEditShop = async (req, res) => {
    try {
        // Extract shop details sent from client
        const { name, city, state, address } = req.body

        // Variable to store Cloudinary image URL (if uploaded)
        let image;

        // If a new image file is uploaded using Multer
        if (req.file) {
            // Upload image to Cloudinary and get secure URL
            image = await uploadOnCloudinary(req.file.path)
        }

        // Check if the logged-in user already owns a shop
        // Assumes one shop per user
        let shop = await Shop.findOne({ owner: req.userId })

        // If no shop exists → create a new shop
        if (!shop) {
            shop = await Shop.create({
                name,
                city,
                state,
                address,
                image,
                owner: req.userId
            })
        } else {
            // If shop exists → update the existing shop
            // { new: true } returns the updated document
            shop = await Shop.findByIdAndUpdate(
                shop._id,
                {
                    name,
                    city,
                    state,
                    address,
                    image,
                    owner: req.userId
                },
                { new: true }
            )
        }

        // Populate owner details instead of returning only owner ID
        await shop.populate("owner")

        // Send success response
        return res.status(201).json(shop)

    } catch (error) {
        // Handle server/database errors
        return res.status(500).json({
            message: "Create/Edit Shop error"
        })
    }
}


// get your shop controller
// Controller to get the shop that belongs to the currently logged-in user
export const getMyShop = async (req, res) => {
    try {
        // Find a shop where the owner field matches the authenticated user's ID
        // Populate owner details and items related to the shop
        const shop = await Shop
            .findOne({ owner: req.userId })
            .populate("owner").populate({
                path: "items",

                // Sort populated items by last updated time
                // -1 means descending order (latest updated item comes first)
                options: { sort: { updatedAt: -1 } }
            });

        // If no shop is found for this user
        if (!shop) {
            // Ideally, send a proper response instead of returning null
            return res.status(404).json({
                message: "Shop not found"
            })
        }

        // If shop is found, return it with HTTP 200 (OK)
        return res.status(200).json(shop)

    } catch (error) {
        // Handle any server/database errors
        return res.status(500).json({
            message: "Get my Shop error"
        })
    }
}

// get the shop which city matches my city
// Get shops whose city matches the given city
export const getShopByCity = async (req, res) => {
  try {
    const { city } = req.params;

    // Validate input
    if (!city) {
      return res.status(400).json({ message: "City is required" });
    }

    // Case-insensitive city match
    const shops = await Shop.find({
      city: { $regex: new RegExp(`^${city}$`, "i") }
    }).populate("items");
    if(!shops){
        return res.status(400).json({message:"shops not found"})
    }

    // ✅ ALWAYS return 200 — even if array is empty
    return res.status(200).json(shops);

  } catch (error) {
    console.error("getShopByCity error:", error);
    return res.status(500).json({
      message: "get shop by city error"
    });
  }
};





