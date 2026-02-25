import React, { useState, useEffect } from "react";

const ProfileSettings = () => {
  // Load user from localStorage
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const user = storedUser || {};
  const isDoctor = user?.role === "doctor";

  // Common state
  const [name, setName] = useState("");
  const [profilePic, setProfilePic] = useState("");

  // Doctor-specific state
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");

  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  // Populate fields once on mount
  useEffect(() => {
    if (!user) return;

    setName(user.name || "");
    setProfilePic(user.profilePic || "");

    if (isDoctor) {
      setSpecialty(user.specialty || "");
      setBio(user.bio || "");
      setPhone(user.contact || "");
    }
  }, []); // empty dependency array ensures this runs once

  // Handle profile image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "Mind_Bridge");

    try {
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/drwpr138z/image/upload",
        { method: "POST", body: formData }
      );
      const data = await res.json();
      setProfilePic(data.secure_url);
    } catch (err) {
      console.error("Image upload error:", err);
      setError("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // Handle saving profile
  const handleSave = async () => {
    if (!user?._id) {
      setError("User not found. Please login again.");
      return;
    }

    setError("");

    try {
      // Prepare payload
      const payload = {
        name,
        specialty,
        bio,
        contact: phone,
        profilePic, // make sure this matches backend field
      };

      // Update doctor profile (with upsert backend)
      const res = await fetch(`http://localhost:3000/api/doctor/profile/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Profile update failed");
      }

      const result = await res.json();
      alert(result.message || "Profile updated successfully!");

      // Update localStorage with new doctor data
      const updatedUser = {
        ...user,
        name,
        profilePic,
        specialty,
        bio,
        contact: phone,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err.message || "Profile update failed.");
    }
  };

  // Helper to render input fields
  const renderField = (label, element) => (
    <div className="mb-4">
      <label className="text-blue-600 font-semibold mb-1 block">{label}</label>
      {element}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-50 rounded shadow">
      <h2 className="text-3xl font-bold mb-6 text-center">Profile Settings</h2>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="flex flex-col items-center mb-6">
        <img
          src={profilePic || "/assets/images/default-user.png"}
          alt="Profile"
          className="w-28 h-28 rounded-full object-cover mb-2 border-2 border-blue-600"
        />
        <input type="file" onChange={handleImageUpload} disabled={uploading} />
      </div>

      {renderField(
        "Full Name",
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 px-3 py-2 rounded"
        />
      )}

      {isDoctor && (
        <>
          {renderField(
            "Specialty",
            <input
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded"
            />
          )}
          {renderField(
            "Bio",
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded"
            />
          )}
          {renderField(
            "Contact",
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded"
            />
          )}
        </>
      )}

      <div className="text-center mt-6">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default ProfileSettings;