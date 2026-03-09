const { MongoClient } = require("mongodb");
const { loadEnvironment } = require("./environment");

loadEnvironment();

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is required");
}

let client;
let clientPromise;

function getMongoClient() {
  if (!clientPromise) {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }
  return clientPromise;
}

module.exports = { getMongoClient };
