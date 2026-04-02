import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
export const connectDB = async () => {
  const localMongoUri = "mongodb://127.0.0.1:27017/techlearn";
  let primaryMongoUri = process.env.MONGO_URI;
  const disableInMemory = process.env.DISABLE_IN_MEMORY_MONGO === "true";
  const canUseInMemory = process.env.NODE_ENV !== "production" && !disableInMemory;

  if (
    !primaryMongoUri ||
    primaryMongoUri.includes("your_mongodb_connection_string")
  ) {
    primaryMongoUri = localMongoUri;
    console.warn(
      "[MongoDB] MONGO_URI not set (or is placeholder). Using local:",
      localMongoUri,
    );
  }

  const tryConnect = async (uri, label) => {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000,
    });
    console.log(
      `MongoDB Connected Successfully${label ? ` (${label})` : ""}`,
    );
  };

  let primaryMessage;
  try {
    await tryConnect(primaryMongoUri, "primary");
    return;
  } catch (primaryError) {
    primaryMessage = primaryError?.message || String(primaryError);
    console.error(`[MongoDB] Primary connection failed: ${primaryMessage}`);
  }

  let localMessage;
  // For local dev it's common to have an unreachable Atlas/SRV URI.
  // Try local MongoDB if the primary URI is not already local.
  if (primaryMongoUri !== localMongoUri) {
    console.warn("[MongoDB] Falling back to local MongoDB:", localMongoUri);
    try {
      await tryConnect(localMongoUri, "local fallback");
      return;
    } catch (fallbackError) {
      localMessage = fallbackError?.message || String(fallbackError);
      console.error(`[MongoDB] Local fallback connection failed: ${localMessage}`);
    }
  }

  // Final dev fallback: in-memory MongoDB.
  if (canUseInMemory) {
    const disableAutoSeed = process.env.DISABLE_AUTO_SEED_USERS === "true";
    console.warn(
      "[MongoDB] Using in-memory MongoDB for local development (data will not persist).",
    );

    try {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const memoryServer = await MongoMemoryServer.create({
        instance: { dbName: "techlearn" },
      });
      const memoryUri = memoryServer.getUri();

      // Best-effort shutdown for nodemon/dev restarts.
      const stopMemoryServer = async () => {
        try {
          await memoryServer.stop();
        } catch {
          // ignore
        }
      };
      process.once("SIGINT", stopMemoryServer);
      process.once("SIGTERM", stopMemoryServer);

      await tryConnect(memoryUri, "in-memory");

      if (!disableAutoSeed) {
        try {
          const { seedUsers } = await import("../utils/seedUsers.js");
          const results = await seedUsers();
          const summary = results
            .map((r) => `${r.action}:${r.email}`)
            .join(", ");
          console.log(`[seedUsers] In-memory auto-seed complete: ${summary}`);
        } catch (seedError) {
          const seedMessage = seedError?.message || String(seedError);
          console.warn(`[seedUsers] In-memory auto-seed failed: ${seedMessage}`);
        }
      }

      return;
    } catch (inMemoryError) {
      const inMemoryMessage = inMemoryError?.message || String(inMemoryError);
      console.error(`[MongoDB] In-memory fallback failed: ${inMemoryMessage}`);
      throw new Error(
        `Database connection failed. Primary: ${primaryMessage}. Local: ${localMessage || "(not attempted)"}. In-memory: ${inMemoryMessage}`,
      );
    }
  }

  throw new Error(
    `Database connection failed. Primary: ${primaryMessage}. Local: ${localMessage || "(not attempted)"}`,
  );
};
export default connectDB;
