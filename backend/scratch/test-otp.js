import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { storeOTP, verifyOTP } from "../utils/mcqCodingUtils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/techlearn";

async function testLoadBalancing() {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    const key = "test-session:student@example.com";
    const otp = "998877";

    console.log(`\n[Simulating Instance A] Storing OTP: ${otp} for key: ${key}`);
    await storeOTP(key, otp, 2 * 60 * 1000); // 2 minutes expiry
    console.log("OTP stored successfully in DB.");

    console.log(`\n[Simulating Instance B] Verifying OTP: ${otp} for key: ${key}`);
    const isValid = await verifyOTP(key, otp);
    console.log(`Verification Result: ${isValid ? "PASS ✅" : "FAIL ❌"}`);

    if (isValid) {
      console.log("\n[Simulating Instance B] Re-verifying same consumed OTP (should fail):");
      const isStillValid = await verifyOTP(key, otp);
      console.log(`Re-verification Result: ${!isStillValid ? "PASS ✅ (Consumed successfully)" : "FAIL ❌"}`);
    }

    console.log("\nTest Completed successfully.");
  } catch (error) {
    console.error("Test execution failed:", error);
  } finally {
    await mongoose.disconnect();
  }
}

testLoadBalancing();
