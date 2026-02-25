import React, { useState } from "react";

const ProfileSettings = ({ user: propUser }) => {
  // Get current user (from localStorage or prop)
  const user = JSON.parse(localStorage.getItem("user") || "null") || propUser;

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profilePic, setProfilePic] = useState(user?.profilePic || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // ---------- Cloudinary Image Upload ----------
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "Mind_Bridge"); // your Cloudinary preset

    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/drwpr138z/image/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setProfilePic(data.secure_url);
    } catch (err) {
      console.error(err);
      setError("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // ---------- Save Profile Handler ----------
  const handleSave = async () => {
    setError("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(user?._id && { "x-user-id": user._id }),
        },
        body: JSON.stringify({ name, email, profilePic }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      // Update localStorage with new user info
      const updatedUser = { ...user, name, email, profilePic };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      setError("Profile update failed.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-md p-8 mt-12">
      <h2 className="font-['General_Sans'] font-semibold text-dark-blue900 text-2xl md:text-4xl mb-6 text-center">
        Edit Profile
      </h2>

      <div className="flex flex-col items-center gap-4 mb-6">
        <img
          src={profilePic || "/assets/images/default-user.png"}
          alt="Profile"
          className="w-24 h-24 rounded-full object-cover border-2 border-purple-200"
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploading}
        />
        {uploading && <div className="text-blue-600">Uploading...</div>}
      </div>

      <input
        className="p-3 border border-gray-300 rounded-md mb-4 w-full"
        type="text"
        placeholder="Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="p-3 border border-gray-300 rounded-md mb-4 w-full"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}

      <button
        className="w-full py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 font-bold"
        onClick={handleSave}
        disabled={uploading}
      >
        Save Changes
      </button>
    </div>
  );
};

export default ProfileSettings;