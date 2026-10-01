const { getDoctorByUserId, addDoctorSlots } = require("./models/doctorModel");
const { createObjectId } = require("./lib/objectId");

async function addSlotIds() {
  try {
    const doctorId = "699ee04fb7f9efe846f6e9cb";
    const doctor = await getDoctorByUserId(doctorId);

    if (!doctor) {
      console.log("Doctor not found");
      return;
    }

    for (const slot of doctor.slots || []) {
      if (slot._id) continue;
      await addDoctorSlots(doctorId, {
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        slotIdFactory: createObjectId,
      });
    }

    console.log("Slot IDs normalized successfully!");
  } catch (err) {
    console.error(err);
  }
}

addSlotIds();
