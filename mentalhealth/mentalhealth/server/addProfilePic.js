// addProfilePic.js
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

async function addProfilePic() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    
    // Update your admin
    const result = await db.collection('users').updateOne(
      { email: "lakshikahiruni20@gmail.com" },
      { $set: { profilePic: null } } // initial value null
    );

    console.log("Admin profilePic field updated:", result.modifiedCount);
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

addProfilePic();