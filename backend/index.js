import express from "express"
import dotenv from "dotenv"
dotenv.config() 
// Load environment variables from .env file

import connectDb from "./config/db.js"
// Function to connect to MongoDB

import cookieParser from "cookie-parser"
// Middleware to read cookies from request

import authRouter from "./routes/auth.routes.js"
import userRouter from "./routes/user.routes.js"
import shopRouter from "./routes/shop.routes.js"
import itemRouter from "./routes/item.routes.js"
import orderRouter from "./routes/order.routes.js"
// Import all route files

import cors from "cors"
// Middleware to allow cross-origin requests

import http from "http"
// Node's HTTP module (Socket.IO requires raw HTTP server)

import { Server } from "socket.io"
import { socketHandler } from "./socket.js"
// Socket.IO server class


const app = express()
// Create Express application

// Create HTTP server using Express app
// This is REQUIRED because Socket.IO works on top of HTTP server
const server = http.createServer(app)


// Create Socket.IO server and attach it to HTTP server
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // frontend URL
        credentials: true,               // allow cookies
        methods: ['POST', 'GET']         // allowed methods
    }
})


// Store io instance inside Express app
// Now you can access it anywhere using: req.app.get("io")
app.set("io", io)


const port = process.env.PORT || 5000


// Middleware to parse incoming JSON data from frontend
app.use(express.json())


// Enable CORS for Express APIs
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))


// Middleware to parse cookies from request headers
app.use(cookieParser())


// Register all API routes
app.use("/api/auth", authRouter)
app.use("/api/user", userRouter)
app.use("/api/shop", shopRouter)
app.use("/api/item", itemRouter)
app.use("/api/order", orderRouter)

// call the socket handler to connect with the frontend
socketHandler(io)


// IMPORTANT:
// Since we created a custom HTTP server,
// we must use server.listen instead of app.listen
server.listen(port, () => {
    connectDb() // connect to database when server starts
    console.log(`Server Started at ${port}`)
})