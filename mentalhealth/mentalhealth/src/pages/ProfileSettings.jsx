import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ProfileSettings = () => {
  const navigate = useNavigate();
  // Get current logged-in user
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!user) {
    navigate("/login"); // redirect if not logged in
    return null;
  }

  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [profilePic, setProfilePic] = useState(user.profilePic || "");
  const [birthday, setBirthday] = useState(user.birthday || "");
  const [age, setAge] = useState(user.age || "");
  const [gender, setGender] = useState(user.gender || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [address, setAddress] = useState(user.address || "");
  const [zipcode, setZipcode] = useState(user.zipcode || "");
  const [country, setCountry] = useState(user.country || "");
  const [city, setCity] = useState(user.city || "");
  const [guardianName, setGuardianName] = useState(user.guardianName || "");
  const [guardianPhone, setGuardianPhone] = useState(user.guardianPhone || "");
  const [guardianEmail, setGuardianEmail] = useState(user.guardianEmail || "");
  const [illnesses, setIllnesses] = useState(user.illnesses || "");

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "Mind_Bridge");

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

  const handleSave = async () => {
    setError("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user._id, // ensure only this user updates
        },
        body: JSON.stringify({
          name, email, profilePic,
          birthday, age, gender, phone, address, zipcode, country, city,
          guardianName, guardianPhone, guardianEmail, illnesses
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      // Update localStorage
      const updatedUser = {
        ...user, name, email, profilePic,
        birthday, age, gender, phone, address, zipcode, country, city,
        guardianName, guardianPhone, guardianEmail, illnesses
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      setError("Profile update failed.");
    }
  };

  return (
    <div
      className="w-full min-h-[calc(100vh-100px)] flex justify-center items-start pt-8 pb-12 cursor-pointer bg-slate-50"
      onClick={() => navigate("/")}
    >
      <div
        className="w-full max-w-4xl mx-auto bg-white rounded-[2rem] shadow-xl p-8 md:p-12 cursor-default mt-8 border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-['General_Sans'] font-semibold text-dark-blue900 text-3xl md:text-4xl mb-8 text-center">
          Edit Profile
        </h2>

        <div className="flex flex-col items-center gap-4 mb-10">
          <img
            src={profilePic || "/assets/images/default-user.png"}
            alt="Profile"
            className="w-28 h-28 rounded-full object-cover border-4 border-blue-50 shadow-md"
          />
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <button
              className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full font-medium text-sm hover:bg-blue-100 transition border border-blue-100"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Change Photo'}
            </button>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-center">{error}</div>}

        <div className="space-y-8">
          {/* Personal Details */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="p-3 border border-gray-200 rounded-xl w-full" />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="p-3 border border-gray-200 rounded-xl w-full" />
              <input type="date" placeholder="Birthday" value={birthday} onChange={(e) => setBirthday(e.target.value)} className="p-3 border border-gray-200 rounded-xl w-full" />
              <input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} className="p-3 border border-gray-200 rounded-xl w-full" />
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="p-3 border border-gray-200 rounded-xl w-full">
                <option value="" disabled>Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <input type="text" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className="p-3 border border-gray-200 rounded-xl w-full" />
            </div>
          </div>

          {/* Location Details */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} className="p-3 border border-gray-200 rounded-xl w-full md:col-span-2" />
              <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="p-3 border border-gray-200 rounded-xl w-full" />
              <input type="text" placeholder="Zipcode" value={zipcode} onChange={(e) => setZipcode(e.target.value)} className="p-3 border border-gray-200 rounded-xl w-full" />
              <input type="text" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} className="p-3 border border-gray-200 rounded-xl w-full md:col-span-2" />
            </div>
          </div>

          {/* Guardian Info */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Guardian / Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Guardian's Name" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} className="p-3 border border-gray-200 rounded-xl w-full md:col-span-2" />
              <input type="text" placeholder="Guardian's Phone Number" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} className="p-3 border border-gray-200 rounded-xl w-full" />
              <input type="email" placeholder="Guardian's Email" value={guardianEmail} onChange={(e) => setGuardianEmail(e.target.value)} className="p-3 border border-gray-200 rounded-xl w-full" />
            </div>
          </div>

          {/* Medical Context */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Medical Profile</h3>
            <textarea placeholder="Medical Info" value={illnesses} onChange={(e) => setIllnesses(e.target.value)} className="p-4 border border-gray-200 rounded-xl w-full h-32" />
          </div>
        </div>

        <div className="mt-12 flex justify-end">
          <button onClick={handleSave} className="px-10 py-3.5 rounded-xl text-white bg-blue-600 hover:bg-blue-700 w-full md:w-auto" disabled={uploading}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;