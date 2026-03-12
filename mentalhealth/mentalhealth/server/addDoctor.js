// addDoctor.js
const { upsertDoctorProfile } = require("./models/doctorModel");

async function addDoctor() {
  try {
    const doctorData = await upsertDoctorProfile("699dcf89e26404774f86ec65", {
      name: "Dr. Ishara Wijayarathna",
      specialty: "Clinical Psychologist",
      bio: "5+ years helping adults with stress, anxiety, and mental well-being.",
      profilePic: "/uploads/ishara.png",
      updatedAt: new Date(),
    });
    console.log("Doctor upserted with ID:", doctorData.doctor.userId);
  } catch (err) {
    console.error("Error adding doctor:", err);
  }
}

addDoctor();
