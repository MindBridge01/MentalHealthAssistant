const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

async function addSlotIds() {
  const uri = process.env.MONGODB_URI; // your MongoDB Atlas URI
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("Mind_Bridge"); // your DB name
    const doctors = db.collection("doctors");

    const doctorId = "699ee04fb7f9efe846f6e9cb"; // your doctor _id
    const doctor = await doctors.findOne({ _id: new ObjectId(doctorId) });

    if (!doctor) return console.log("Doctor not found");

    // Add _id to each slot if not exists
    const updatedSlots = doctor.slots.map(slot => {
      if (!slot._id) slot._id = new ObjectId();
      return slot;
    });

    await doctors.updateOne(
      { _id: new ObjectId(doctorId) },
      { $set: { slots: updatedSlots } }
    );

    console.log("Slot _id fields added successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

addSlotIds();