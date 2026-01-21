/* eslint-disable no-undef */
import { MongoClient } from "mongodb";

// MongoDB connection string (use environment variable for security)
const uri = process.env.MONGODB_URI;
let client;
let clientPromise;

if (!uri) {
  throw new Error("Please add your MongoDB URI to .env or Vercel environment variables");
}

// In development, create a new client for each request to avoid issues with hot reloading
// In production, reuse the client to optimize performance
if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, create a single client and reuse it
  client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  clientPromise = client.connect();
}

export async function getMongoClient() {
  return await clientPromise;
}
/* eslint-enable no-undef */