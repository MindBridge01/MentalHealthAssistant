// addDoctor.js
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGODB_URI; // your MongoDB URI
const client = new MongoClient(uri);

async function addDoctor() {
  try {
    await client.connect();
    const db = client.db("Mind_Bridge"); // your database name
    const doctorsCollection = db.collection("doctors");

    const doctorData = {
      userId: new ObjectId("699dcf89e26404774f86ec65"), // replace with your doctor user _id
      name: "Dr. Ishara Wijayarathna",
      specialty: "Clinical Psychologist",
      bio: "5+ years helping adults with stress, anxiety, and mental well-being.",
      profilePic: "/uploads/ishara.png",
      slots: [
        { date: "2026-02-25", time: "10:00" },
        { date: "2026-02-26", time: "14:00" }
      ],
      appointments: [
        { id: 1, patient: "Alice Brown", date: "2026-02-25", time: "10:00", status: "Upcoming", notes: "Initial consultation" },
        { id: 2, patient: "Bob Green", date: "2026-02-20", time: "09:00", status: "Completed", notes: "Follow-up session" }
      ],
      messages: [
        { id: 1, from: "Alice Brown", content: "Thank you for your guidance!", date: "2026-02-20" },
        { id: 2, from: "System", content: "New appointment booked for 2026-02-25 10:00", date: "2026-02-19" }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await doctorsCollection.insertOne(doctorData);
    console.log("Doctor added with ID:", result.insertedId);
  } catch (err) {
    console.error("Error adding doctor:", err);
  } finally {
    await client.close();
  }
}

addDoctor();