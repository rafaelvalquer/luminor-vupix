import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../lib/logger.js";

function maskMongoUri(uri) {
  try {
    const parsed = new URL(uri);
    if (parsed.username) parsed.username = "***";
    if (parsed.password) parsed.password = "***";
    return parsed.toString();
  } catch {
    return String(uri).replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");
  }
}

export async function connectDatabase() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  logger.info("mongodb_connected", { uri: maskMongoUri(env.mongoUri) });
}
