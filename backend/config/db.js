import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
export const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;
    if (!mongoUri || mongoUri.includes("your_mongodb_connection_string")) {
      mongoUri = "mongodb://127.0.0.1:27017/techlearn";
      console.warn(
        "[MongoDB] MONGO_URI not set (or is placeholder). Falling back to local:",
        mongoUri,
      );
    }

    const conn = await mongoose.connect(mongoUri, {});
    console.log(`MongoDB Connected Successfully`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // In serverless environments (like Vercel), don't exit the process
    // Just throw the error to be handled by the caller
    throw new Error(`Database connection failed: ${error.message}`);
  }
};
export default connectDB;
