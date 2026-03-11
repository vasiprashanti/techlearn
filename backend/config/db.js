import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
dotenv.config();
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {});
    console.log(`MongoDB Connected Successfully`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // In serverless environments (like Vercel), don't exit the process
    // Just throw the error to be handled by the caller
    throw new Error(`Database connection failed: ${error.message}`);
  }
};
export default connectDB;
