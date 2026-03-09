import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiRequest } from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ProfileSettings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser, logout } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profilePic, setProfilePic] = useState(user?.profilePic || "");
  const [birthday, setBirthday] = useState(user?.birthday || "");
  const [age, setAge] = useState(user?.age || "");
  const [gender, setGender] = useState(user?.gender || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [zipcode, setZipcode] = useState(user?.zipcode || "");
  const [country, setCountry] = useState(user?.country || "");
  const [city, setCity] = useState(user?.city || "");
  const [guardianName, setGuardianName] = useState(user?.guardianName || "");
  const [guardianPhone, setGuardianPhone] = useState(user?.guardianPhone || "");
  const [guardianEmail, setGuardianEmail] = useState(user?.guardianEmail || "");
  const [illnesses, setIllnesses] = useState(user?.illnesses || "");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const onboarding = Boolean(location.state?.onboarding);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true, state: { from: "/profile-settings" } });
      return;
    }

    if (user.role === "doctor") {
      navigate("/doctor/dashboard", { replace: true });
    }
  }, [navigate, user]);

  const validateForm = () => {
    if (!name.trim()) return "Full name is required.";
    if (!EMAIL_REGEX.test(email.trim())) return "Please enter a valid email address.";
    if (!birthday) return "Date of birth is required.";
    if (!String(age).trim()) return "Age is required.";
    if (!gender) return "Please select gender.";
    if (!phone.trim()) return "Phone number is required.";
    if (!address.trim()) return "Address is required.";
    if (!zipcode.trim()) return "Zip code is required.";
    if (!country.trim()) return "Country is required.";
    if (!city.trim()) return "City is required.";
    if (!guardianName.trim()) return "Guardian name is required.";
    if (!guardianPhone.trim()) return "Guardian phone number is required.";
    if (!EMAIL_REGEX.test(guardianEmail.trim())) return "Please enter a valid guardian email address.";
    if (!illnesses.trim()) return "Medical context is required.";
    return "";
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "Mind_Bridge");

    try {
      const response = await fetch("https://api.cloudinary.com/v1_1/drwpr138z/image/upload", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok || !payload.secure_url) {
        throw new Error("Image upload failed.");
      }

      setProfilePic(payload.secure_url);
    } catch (_err) {
      setError("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setError("");
    setMessage("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);
    try {
      await apiRequest("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          profilePic,
          birthday,
          age,
          gender,
          phone: phone.trim(),
          address: address.trim(),
          zipcode: zipcode.trim(),
          country: country.trim(),
          city: city.trim(),
          guardianName: guardianName.trim(),
          guardianPhone: guardianPhone.trim(),
          guardianEmail: guardianEmail.trim().toLowerCase(),
          illnesses: illnesses.trim(),
        }),
      });

      const updatedUser = {
        ...user,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        profilePic,
        birthday,
        age,
        gender,
        phone: phone.trim(),
        address: address.trim(),
        zipcode: zipcode.trim(),
        country: country.trim(),
        city: city.trim(),
        guardianName: guardianName.trim(),
        guardianPhone: guardianPhone.trim(),
        guardianEmail: guardianEmail.trim().toLowerCase(),
        illnesses: illnesses.trim(),
      };

      setUser(updatedUser);
      setMessage(onboarding ? "Welcome. Your profile is complete." : "Profile updated successfully.");

      if (location.state?.from) {
        navigate(location.state.from);
      }
    } catch (err) {
      if (err.status === 401) {
        await logout();
        navigate("/login", { replace: true, state: { from: "/profile-settings" } });
        return;
      }
      setError(err.message || "Profile update failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-100px)] flex justify-center items-start pt-8 pb-12 bg-slate-50">
      <div className="w-full max-w-4xl mx-auto bg-white rounded-[2rem] shadow-sm p-8 md:p-12 mt-8 border border-slate-200">
        <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 text-center mb-2">
          {onboarding ? "Complete Your Care Profile" : "Profile Settings"}
        </h1>
        <p className="text-center text-slate-600 mb-8">
          Keep your information accurate so your care team and emergency contacts can support you.
        </p>

        <div className="flex flex-col items-center gap-4 mb-8">
          <img
            src={profilePic || "/assets/images/default-user.png"}
            alt="Profile"
            className="w-28 h-28 rounded-full object-cover border-4 border-sky-50"
          />
          <label className="relative cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <span className="inline-block bg-sky-50 text-sky-700 px-4 py-2 rounded-full text-sm font-medium border border-sky-100">
              {uploading ? "Uploading..." : "Change Photo"}
            </span>
          </label>
        </div>

        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-4">
            {error}
          </div>
        )}
        {message && (
          <div role="status" className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl mb-4">
            {message}
          </div>
        )}

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b pb-2">Personal Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="p-3 border border-slate-300 rounded-xl w-full" />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="p-3 border border-slate-300 rounded-xl w-full" />
              <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className="p-3 border border-slate-300 rounded-xl w-full" />
              <input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} className="p-3 border border-slate-300 rounded-xl w-full" />
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="p-3 border border-slate-300 rounded-xl w-full">
                <option value="" disabled>Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <input type="text" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className="p-3 border border-slate-300 rounded-xl w-full" />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b pb-2">Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} className="p-3 border border-slate-300 rounded-xl w-full md:col-span-2" />
              <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="p-3 border border-slate-300 rounded-xl w-full" />
              <input type="text" placeholder="Zipcode" value={zipcode} onChange={(e) => setZipcode(e.target.value)} className="p-3 border border-slate-300 rounded-xl w-full" />
              <input type="text" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} className="p-3 border border-slate-300 rounded-xl w-full md:col-span-2" />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b pb-2">Guardian Contact</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Guardian Name" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} className="p-3 border border-slate-300 rounded-xl w-full md:col-span-2" />
              <input type="text" placeholder="Guardian Phone Number" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} className="p-3 border border-slate-300 rounded-xl w-full" />
              <input type="email" placeholder="Guardian Email" value={guardianEmail} onChange={(e) => setGuardianEmail(e.target.value)} className="p-3 border border-slate-300 rounded-xl w-full" />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b pb-2">Medical Context</h2>
            <textarea placeholder="Current illnesses, history, or notes" value={illnesses} onChange={(e) => setIllnesses(e.target.value)} className="p-4 border border-slate-300 rounded-xl w-full h-32" />
          </section>
        </div>

        <div className="mt-10 flex justify-end">
          <button
            onClick={handleSave}
            className="px-10 py-3.5 rounded-xl text-white bg-sky-700 hover:bg-sky-800 disabled:bg-slate-400 w-full md:w-auto"
            disabled={uploading || saving}
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
