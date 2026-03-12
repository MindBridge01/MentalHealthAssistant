// addProfilePic.js
const { updateUser, findUserByEmail } = require("./models/userModel");

async function addProfilePic() {
  try {
    const admin = await findUserByEmail("lakshikahiruni20@gmail.com");
    if (!admin) {
      console.log("Admin not found");
      return;
    }

    const updated = await updateUser(admin._id, {
      profilePic: null,
      updatedAt: new Date(),
    });
    console.log("Admin profilePic field updated:", Boolean(updated));
  } catch (err) {
    console.error(err);
  }
}

addProfilePic();
