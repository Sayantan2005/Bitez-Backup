import mongoose from "mongoose";

const connectDb = async () => {
    try {
       const conn = await mongoose.connect(process.env.MONGODB_URL) 
       console.log("MongoDB Connected ")

    } catch (error) {
        console.log("DB error")
    }
}

export default connectDb