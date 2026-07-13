import mongoose from "mongoose";
import { getEnv } from "@/lib/env";

declare global {
  var __mongooseConn__: Promise<typeof mongoose> | undefined;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (global.__mongooseConn__) return global.__mongooseConn__;

  const { MONGODB_URI } = getEnv();
  const conn = mongoose.connect(MONGODB_URI, {
    // ponytail: rely on mongoose 9 defaults; bufferCommands already off,
    // serverSelectionTimeoutMS stays default
  });
  global.__mongooseConn__ = conn;
  return conn;
}
