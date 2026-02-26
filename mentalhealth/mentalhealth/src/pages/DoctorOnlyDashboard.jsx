import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const DoctorOnlyDashboard = () => {
  const [profile, setProfile] = useState({
    name: "",
    specialty: "",
    bio: "",
    contact: "",
    profilePic: "",
    yearsOfExperience: "",
    qualifications: "",
    licenseNumber: ""
  });
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [editProfile, setEditProfile] = useState(false);
  const [newSlot, setNewSlot] = useState({ date: "", startTime: "", endTime: "" });
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [editSlotData, setEditSlotData] = useState({ date: "", startTime: "", endTime: "" });

  const [statusMessage, setStatusMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!user || user.role !== "doctor") navigate("/");
    else fetchDoctorProfile();
  }, [user?._id]);

  const fetchDoctorProfile = async () => {
    try {
      const res = await axios.get(`http://localhost:3000/api/doctor/profile/${user._id}`);
      setProfile({
        name: res.data.name || "",
        specialty: res.data.specialty || "",
        bio: res.data.bio || "",
        contact: res.data.contact || "",
        profilePic: res.data.profilePic || "",
        yearsOfExperience: res.data.yearsOfExperience || "",
        qualifications: res.data.qualifications || "",
        licenseNumber: res.data.licenseNumber || ""
      });
      setSlots(res.data.slots || []);
      setAppointments(res.data.appointments || []);
      setMessages(res.data.messages || []);
      setStatusMessage(res.data.statusMessage || "");
    } catch (err) {
      console.error("Fetch profile failed:", err);
    }
  };

  // Handle profile picture upload
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
      setProfile({ ...profile, profilePic: data.secure_url || "" });
    } catch (err) {
      console.error("Image upload error:", err);
      setError("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleProfileSave = async () => {
    try {
      await axios.put(`http://localhost:3000/api/doctor/profile/${user._id}`, {
        ...profile,
        statusMessage
      });
      setEditProfile(false);
      fetchDoctorProfile();
      alert("Profile updated!");
    } catch (err) {
      console.error("Profile update failed:", err);
      setError("Profile update failed.");
    }
  };

  const handleAddSlot = async () => {
    const { date, startTime, endTime } = newSlot;
    if (!date || !startTime || !endTime) return;

    try {
      await axios.post(`http://localhost:3000/api/doctor/slots/${user._id}`, newSlot);
      setNewSlot({ date: "", startTime: "", endTime: "" });
      fetchDoctorProfile();
    } catch (err) {
      alert("Add slot failed. Please try again.");
    }
  };

  const handleEditSlotClick = (slot) => {
    setEditingSlotId(slot._id);
    setEditSlotData({
      date: slot.date || "",
      startTime: slot.startTime || "",
      endTime: slot.endTime || ""
    });
  };

  const handleSaveEditSlot = async () => {
    try {
      if (!editSlotData.date || !editSlotData.startTime || !editSlotData.endTime) return;
      await axios.put(`http://localhost:3000/api/doctor/slots/${user._id}/${editingSlotId}`, editSlotData);
      setEditingSlotId(null);
      fetchDoctorProfile();
    } catch (err) {
      alert(err.response?.data?.error || "Edit slot failed. Please refresh and try again.");
      setEditingSlotId(null);
    }
  };

  const handleCancelEditSlot = () => {
    setEditingSlotId(null);
  };

  const handleRemoveSlot = async (slot) => {
    try {
      if (!slot._id) {
        alert("Cannot delete slot: missing ID. Please refresh the page.");
        return;
      }

      await axios.delete(
        `http://localhost:3000/api/doctor/slots/${user._id}/${slot._id}`
      );

      // Update UI after successful delete
      setSlots((prevSlots) =>
        prevSlots.filter((s) => s._id !== slot._id)
      );
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Remove slot failed. Please refresh and try again.");
    }
  };
  const handleAppointmentStatus = (id, status) => {
    // Basic local state update for now, until the backend appointment route is ready.
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
            src={profile.profilePic || "/assets/images/default-user.png"}
            alt={profile.name || "Doctor"}
            className="w-24 h-24 rounded-full object-cover border-2 border-purple-200"
          />
          <div className="flex-1">
            {editProfile ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    value={profile.name || ""}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    placeholder="E.g. Dr. John Doe"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialization (Psychiatrist / Psychologist / Therapist / Counselor)</label>
                  <input
                    value={profile.specialty || ""}
                    onChange={(e) => setProfile({ ...profile, specialty: e.target.value })}
                    className="p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    placeholder="E.g. Clinical Psychologist"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                  <input
                    type="number"
                    value={profile.yearsOfExperience || ""}
                    onChange={(e) => setProfile({ ...profile, yearsOfExperience: e.target.value })}
                    className="p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    placeholder="E.g. 10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qualifications</label>
                  <input
                    value={profile.qualifications || ""}
                    onChange={(e) => setProfile({ ...profile, qualifications: e.target.value })}
                    className="p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    placeholder="E.g. MBBS, MD, MSc Psychology"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">License / Registration Number</label>
                  <input
                    value={profile.licenseNumber || ""}
                    onChange={(e) => setProfile({ ...profile, licenseNumber: e.target.value })}
                    className="p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    placeholder="Enter Registration Number"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Professional Bio</label>
                  <textarea
                    value={profile.bio || ""}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none min-h-[100px]"
                    placeholder="Share a short professional biography about yourself and your approach to therapy..."
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Information</label>
                  <input
                    value={profile.contact || ""}
                    onChange={(e) => setProfile({ ...profile, contact: e.target.value })}
                    className="p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    placeholder="Public email or Direct clinic phone number"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo (Upload new)</label>
                  <input
                    type="file"
                    onChange={handleImageUpload}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer border border-gray-200 rounded-lg p-2 bg-white"
                    disabled={uploading}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Availability Status Message</label>
                  <input
                    value={statusMessage || ""}
                    onChange={(e) => setStatusMessage(e.target.value)}
                    placeholder="Current status (e.g. Taking new patients currently)"
                    className="p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                </div>

                <div className="col-span-2 flex gap-4 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={handleProfileSave}
                    className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-8 py-2.5 rounded-lg font-medium shadow-sm disabled:opacity-50"
                    disabled={uploading}
                  >
                    {uploading ? "Uploading Image..." : "Save Profile"}
                  </button>
                  <button
                    onClick={() => setEditProfile(false)}
                    className="bg-gray-100 hover:bg-gray-200 transition-colors text-gray-800 px-6 py-2.5 rounded-lg font-medium"
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                </div>
                {error && <div className="text-red-600 mt-1 col-span-2 font-medium bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="font-bold text-3xl text-gray-800">{profile.name || "Doctor Name Please Update"}</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gradient-to-br from-purple-50 to-indigo-50 p-5 rounded-2xl border border-purple-100/50 shadow-sm">
                  <div>
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1"><span className="w-1 h-4 bg-purple-400 rounded-full inline-block"></span>Specialization</span>
                    <div className="text-purple-900 font-semibold text-lg mt-0.5">{profile.specialty || "Not specified"}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1"><span className="w-1 h-4 bg-blue-400 rounded-full inline-block"></span>Qualifications</span>
                    <div className="text-gray-800 font-medium text-lg mt-0.5">{profile.qualifications || "Not specified"}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1"><span className="w-1 h-4 bg-green-400 rounded-full inline-block"></span>Experience</span>
                    <div className="text-gray-800 font-medium text-lg mt-0.5">{profile.yearsOfExperience ? `${profile.yearsOfExperience} years professional` : "Not specified"}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1"><span className="w-1 h-4 bg-orange-400 rounded-full inline-block"></span>License Reg No.</span>
                    <div className="text-gray-800 font-medium text-lg mt-0.5">{profile.licenseNumber || "Not specified"}</div>
                  </div>
                  <div className="col-span-1 md:col-span-2 mt-2">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1"><span className="w-1 h-4 bg-gray-400 rounded-full inline-block"></span>Direct Contact</span>
                    <div className="text-gray-800 font-medium text-lg mt-0.5">{profile.contact || "Not specified"}</div>
                  </div>
                </div>

                <div className="mt-6">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2">Professional Biography</span>
                  {profile.bio ? (
                    <div className="text-gray-700 leading-relaxed bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-md break-words">
                      {profile.bio}
                    </div>
                  ) : (
                    <div className="text-gray-400 italic bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
                      No biography provided yet. Edit your profile to add one.
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-6 text-sm bg-indigo-50 text-indigo-800 w-fit px-4 py-2 rounded-full border border-indigo-200 font-medium shadow-sm">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                  </span>
                  <span>{statusMessage ? `Status: ${statusMessage}` : "Status: Active & Online"}</span>
                </div>

                <button
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all mt-6 active:scale-95"
                  onClick={() => setEditProfile(true)}
                >
                  Configure Profile Details
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Availability Slots */}
        <div className="mt-6">
          <h4 className="font-semibold text-lg text-gray-800 mb-3">Availability</h4>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
            <h5 className="text-sm font-semibold text-gray-700 mb-2">Add New Slot</h5>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                <input
                  type="date"
                  value={newSlot.date}
                  onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
                <input
                  type="time"
                  value={newSlot.startTime}
                  onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
                <input
                  type="time"
                  value={newSlot.endTime}
                  onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <button
                onClick={handleAddSlot}
                className="bg-purple-600 hover:bg-purple-700 transition-colors text-white px-5 py-2 rounded-lg font-medium h-[42px]"
              >
                Add Slot
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {slots.map((slot, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                {editingSlotId === slot._id ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="date"
                      value={editSlotData.date}
                      onChange={(e) => setEditSlotData({ ...editSlotData, date: e.target.value })}
                      className="p-1.5 border border-gray-300 rounded-md text-sm"
                    />
                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={editSlotData.startTime}
                        onChange={(e) => setEditSlotData({ ...editSlotData, startTime: e.target.value })}
                        className="p-1.5 border border-gray-300 rounded-md text-sm w-full"
                      />
                      <input
                        type="time"
                        value={editSlotData.endTime}
                        onChange={(e) => setEditSlotData({ ...editSlotData, endTime: e.target.value })}
                        className="p-1.5 border border-gray-300 rounded-md text-sm w-full"
                      />
                    </div>
                    <div className="flex gap-2 mt-1">
                      <button onClick={handleSaveEditSlot} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1.5 rounded-md font-medium transition-colors">Save</button>
                      <button onClick={handleCancelEditSlot} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs py-1.5 rounded-md font-medium transition-colors">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">{slot.date}</div>
                      <div className="text-purple-600 font-medium text-sm mt-0.5">
                        {slot.startTime} - {slot.endTime}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSlotClick(slot)}
                        className="text-blue-600 hover:text-blue-800 border border-blue-200 bg-blue-50 px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemoveSlot(slot)}
                        className="text-red-600 hover:text-red-800 border border-red-200 bg-red-50 px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {slots.length === 0 && (
              <div className="col-span-1 md:col-span-2 text-center text-gray-500 py-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-sm">
                No slots available. Add your first slot above.
              </div>
            )}
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
              <th>Email</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id} className="border-b hover:bg-gray-50 transition-colors">
                <td
                  className="font-medium text-purple-700 cursor-pointer hover:underline"
                  onClick={() => navigate(`/patient-profile/${a.patientId}`)}
                  title="View Patient Profile"
                >
                  {a.patient}
                </td>
                <td>{a.patientEmail || "N/A"}</td>
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