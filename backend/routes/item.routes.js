import express from "express"
import { upload } from "../middleware/multer.js"
import isAuth from "../middleware/isAuth.js"
import { addItem, deleteItem, editItem, getItemByCity, getItemById, getItemsByShop, rating, searchItems } from "../controllers/item.controller.js"



const itemRouter = express.Router()

itemRouter.post("/add-item",isAuth,upload.single("image"),addItem) //becuse we send one single image for each item


itemRouter.post("/edit-item/:itemId",isAuth,upload.single("image"),editItem)

itemRouter.get("/get-by-id/:itemId",isAuth,getItemById)

itemRouter.delete("/delete/:itemId",isAuth,deleteItem)

itemRouter.get("/get-by-city/:city",isAuth,getItemByCity)

itemRouter.get("/get-by-shop/:shopId",isAuth,getItemsByShop)

itemRouter.get("/search-items",isAuth,searchItems)
itemRouter.post("/rating",isAuth,rating)




export default itemRouter