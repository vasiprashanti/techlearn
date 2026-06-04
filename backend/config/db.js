import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const ATLAS_FALLBACKS = {
  "techlearncluster1.l8lcpzo.mongodb.net": {
    hosts: [
      "ac-7j2frxv-shard-00-00.l8lcpzo.mongodb.net:27017",
      "ac-7j2frxv-shard-00-01.l8lcpzo.mongodb.net:27017",
      "ac-7j2frxv-shard-00-02.l8lcpzo.mongodb.net:27017",
    ],
    extraParams: {
      authSource: "admin",
      replicaSet: "atlas-xweccw-shard-0",
      tls: "true",
    },
  },
};

const buildFallbackMongoUri = (mongoUri) => {
  if (!mongoUri || !mongoUri.startsWith("mongodb+srv://")) {
    return null;
  }

  try {
    const parsed = new URL(mongoUri);
    const fallback = ATLAS_FALLBACKS[parsed.hostname];
    if (!fallback) {
      return null;
    }

    const params = new URLSearchParams(parsed.search);
    Object.entries(fallback.extraParams || {}).forEach(([key, value]) => {
      if (!params.has(key)) {
        params.set(key, value);
      }
    });

    const authPart = parsed.username
      ? `${encodeURIComponent(decodeURIComponent(parsed.username))}:${encodeURIComponent(decodeURIComponent(parsed.password))}@`
      : "";

    const search = params.toString();
    return `mongodb://${authPart}${fallback.hosts.join(",")}/${search ? `?${search}` : ""}`;
  } catch (error) {
    return null;
  }
};

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {});
    console.log(`MongoDB Connected Successfully`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    const fallbackUri = buildFallbackMongoUri(process.env.MONGO_URI);
    if (fallbackUri && /querySrv/i.test(error.message || "")) {
      try {
        await mongoose.connect(fallbackUri, {});
        console.log("MongoDB Connected Successfully using fallback host list");
        return;
      } catch (fallbackError) {
        console.error(`Fallback MongoDB Error: ${fallbackError.message}`);
        throw new Error(`Database connection failed: ${fallbackError.message}`);
      }
    }

    throw new Error(`Database connection failed: ${error.message}`);
  }
};
export default connectDB;
