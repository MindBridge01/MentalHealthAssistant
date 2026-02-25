import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const DoctorOnlyDashboard = () => {
  // Initialize profile with default values to avoid uncontrolled inputs
  const [profile, setProfile] = useState({
    name: "",
    specialty: "",
    bio: "",
    contact: "",
    photo: ""
  });
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [editProfile, setEditProfile] = useState(false);
  const [newSlot, setNewSlot] = useState({ date: "", time: "" });
  const [statusMessage, setStatusMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  // Redirect if not doctor and fetch profile
  useEffect(() => {
    if (!user || user.role !== "doctor") navigate("/");
    else fetchDoctorProfile();
  }, [user]);

  // Fetch doctor profile from backend
  const fetchDoctorProfile = async () => {
    try {
      const res = await axios.get(`http://localhost:3000/api/doctor/profile/${user._id}`);
      setProfile({
        name: res.data.name || "",
        specialty: res.data.specialty || "",
        bio: res.data.bio || "",
        contact: res.data.contact || "",
        photo: res.data.photo || ""
      });
      setSlots(res.data.slots || []);
      setAppointments(res.data.appointments || []);
      setMessages(res.data.messages || []);
      setStatusMessage(res.data.statusMessage || "");
    } catch (err) {
      console.error("Fetch profile failed:", err);
    }
  };

  // ProfilePic upload handler (Cloudinary)
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "Mind_Bridge"); // Cloudinary preset
    try {
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/drwpr138z/image/upload",
        { method: "POST", body: formData }
      );
      const data = await res.json();
      setProfile({ ...profile, photo: data.secure_url || "" });
    } catch (err) {
      setError("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // Save profile updates to backend
  const handleProfileSave = async () => {
    try {
      await axios.put(`http://localhost:3000/api/doctor/profile/${user._id}`, { 
        ...profile, 
        statusMessage,
        profilePic: profile.photo
      });
      setEditProfile(false);
      fetchDoctorProfile();
      alert("Profile updated!");
    } catch (err) {
      console.error("Profile update failed:", err);
      setError("Profile update failed.");
    }
  };

  // Add new availability slot
  const handleAddSlot = async () => {
    if (!newSlot.date || !newSlot.time) return;
    try {
      await axios.post(`http://localhost:3000/api/doctor/slots/${user._id}`, newSlot);
      setSlots([...slots, newSlot]);
      setNewSlot({ date: "", time: "" });
    } catch (err) {
      console.error("Add slot failed:", err);
      setError("Add slot failed.");
    }
  };

  // Remove slot from backend and state
  const handleRemoveSlot = async (slot) => {
    try {
      await axios.delete(`http://localhost:3000/api/doctor/slots/${user._id}`, { data: slot });
      setSlots(slots.filter((s) => !(s.date === slot.date && s.time === slot.time)));
    } catch (err) {
      console.error("Remove slot failed:", err);
      setError("Remove slot failed.");
    }
  };

  // Update appointment status locally
  const handleAppointmentStatus = (id, status) => {
    setAppointments(appointments.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="w-full min-h-screen bg-purple-50 py-12 px-4 flex flex-col items-center">
      {/* Profile Management */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-md p-6 mb-8">
        <h3 className="font-bold text-xl mb-4">Profile Management</h3>
        <div className="flex gap-6 items-center">
          <img
            src={profile.photo || "/assets/images/default-user.png"}
            alt={profile.name || "Doctor"}
            className="w-24 h-24 rounded-full object-cover border-2 border-purple-200"
          />
          <div className="flex-1">
            {editProfile ? (
              <>
                <input
                  value={profile.name || ""}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="p-2 border rounded mb-2 w-full"
                />
                <input
                  value={profile.specialty || ""}
                  onChange={(e) => setProfile({ ...profile, specialty: e.target.value })}
                  className="p-2 border rounded mb-2 w-full"
                />
                <textarea
                  value={profile.bio || ""}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="p-2 border rounded mb-2 w-full"
                />
                <input
                  value={profile.contact || ""}
                  onChange={(e) => setProfile({ ...profile, contact: e.target.value })}
                  className="p-2 border rounded mb-2 w-full"
                />
                <input
                  type="file"
                  onChange={handleImageUpload}
                  className="mb-2"
                  disabled={uploading}
                />
                <input
                  value={statusMessage || ""}
                  onChange={(e) => setStatusMessage(e.target.value)}
                  placeholder="Status message"
                  className="p-2 border rounded mb-2 w-full"
                />
                <button
                  onClick={handleProfileSave}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                  disabled={uploading}
                >
                  Save
                </button>
                {error && <div className="text-red-600 mt-1">{error}</div>}
              </>
            ) : (
              <>
                <div className="font-bold text-lg">{profile.name || ""}</div>
                <div className="text-purple-700 font-medium">{profile.specialty || ""}</div>
                <div className="text-gray-700 mb-2">{profile.bio || ""}</div>
                <div className="text-gray-500">Contact: {profile.contact || ""}</div>
                <div className="text-purple-600 mt-2">Status: {statusMessage || ""}</div>
                <button
                  className="bg-purple-100 text-purple-700 px-4 py-2 rounded mt-2"
                  onClick={() => setEditProfile(true)}
                >
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>

        {/* Availability Slots */}
        <div className="mt-6">
          <h4 className="font-semibold">Availability</h4>
          <div className="flex gap-2 flex-wrap mb-2">
            {slots.map((slot, idx) => (
              <div
                key={idx}
                className="px-3 py-1 rounded-lg border bg-purple-50 text-purple-700 flex items-center gap-2"
              >
                {slot.date} {slot.time}
                <button
                  className="text-red-600 font-bold ml-2"
                  onClick={() => handleRemoveSlot(slot)}
                >
                  x
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={newSlot.date || ""}
              onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
              className="p-2 border rounded"
            />
            <input
              type="time"
              value={newSlot.time || ""}
              onChange={(e) => setNewSlot({ ...newSlot, time: e.target.value })}
              className="p-2 border rounded"
            />
            <button
              onClick={handleAddSlot}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Add Slot
            </button>
          </div>
        </div>
      </div>

      {/* Appointments */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-md p-6 mb-8">
        <h3 className="font-bold text-xl mb-4">Appointments</h3>
        <table className="w-full mb-4 border">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id} className="border-b">
                <td>{a.patient}</td>
                <td>{a.date}</td>
                <td>{a.time}</td>
                <td>{a.status}</td>
                <td>{a.notes}</td>
                <td>
                  {a.status === "Upcoming" && (
                    <>
                      <button
                        className="bg-green-600 text-white px-2 py-1 rounded mr-2"
                        onClick={() => handleAppointmentStatus(a.id, "Completed")}
                      >
                        Complete
                      </button>
                      <button
                        className="bg-yellow-600 text-white px-2 py-1 rounded mr-2"
                        onClick={() => handleAppointmentStatus(a.id, "Rescheduled")}
                      >
                        Reschedule
                      </button>
                      <button
                        className="bg-red-600 text-white px-2 py-1 rounded"
                        onClick={() => handleAppointmentStatus(a.id, "Cancelled")}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Messages */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-md p-6">
        <h3 className="font-bold text-xl mb-4">Messages</h3>
        <div className="flex flex-col gap-4">
          {messages.map((msg) => (
            <div key={msg.id} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="font-bold text-purple-700">{msg.from}</div>
              <div className="text-gray-700 mb-1">{msg.content}</div>
              <div className="text-gray-400 text-xs">{msg.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DoctorOnlyDashboard;