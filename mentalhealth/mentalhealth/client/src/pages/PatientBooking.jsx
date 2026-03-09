import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import axios from "axios";
import { apiUrl } from "../config/api";
import { useAuth } from "../context/AuthContext";

const PatientBooking = () => {
  const [doctorsList, setDoctorsList] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [message, setMessage] = useState("");
  const [myAppointments, setMyAppointments] = useState([]);
  const [booking, setBooking] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    // When selected doctor changes, reset slot and message
    setSelectedSlot("");
    setMessage("");
  }, [selectedDoctor]);

  React.useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await axios.get(apiUrl("/api/doctor/all"), { withCredentials: true });
        // Filter out doctors that haven't at least provided a name
        const activeDoctors = res.data.filter(doc => doc.name);
        setDoctorsList(activeDoctors);
      } catch (err) {
        console.error("Failed to load doctors", err);
      }
    };

    const fetchMyAppointments = async () => {
      if (user?._id) {
        try {
          const res = await axios.get(
            apiUrl(`/api/doctor/patient-appointments/${user._id}`),
            { withCredentials: true }
          );
          if (res.data.appointments) {
            setMyAppointments(res.data.appointments);
          }
        } catch (err) {
          console.error("Failed to load your appointments", err);
        }
      }
    };

    fetchDoctors();
    fetchMyAppointments();
  }, [user?._id]);

  const handleBookAppointment = async () => {
    if (!user) {
      alert("Please login as a patient to book an appointment.");
      navigate("/login", { state: { from: "/doctor-dashboard" } });
      return;
    }

    if (!user.phone || !user.age || !user.gender || !user.guardianEmail) {
      alert("Please complete your profile before booking an appointment.");
      navigate("/profile-settings", { state: { from: "/doctor-dashboard" } });
      return;
    }
    if (!selectedSlot) return;

    setBooking(true);

    // Parse the slotStr "YYYY-MM-DD HH:MM - HH:MM"
    const parts = selectedSlot.split(' ');
    const slotDate = parts[0];
    const slotTime = `${parts[1]} ${parts[2]} ${parts[3]}`;

    try {
      const selectedSlotObj = selectedDoctor.slots.find(s => `${s.date} ${s.startTime} - ${s.endTime}` === selectedSlot);
      const slotId = selectedSlotObj ? selectedSlotObj._id : null;

      const res = await axios.post(
        apiUrl(`/api/doctor/appointments/${selectedDoctor.userId}`),
        {
          patientId: user._id,
          patientName: user.name,
          patientEmail: user.email,
          slotDate,
          slotTime,
          notes: message,
          slotId
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        alert("Appointment booked successfully!");
        setMyAppointments([
          ...myAppointments,
          { doctorName: selectedDoctor.name, date: slotDate, time: slotTime, status: 'Upcoming' }
        ]);

        // Remove locally immediately
        setSelectedDoctor(prev => ({
          ...prev,
          slots: prev.slots.filter(s => s._id !== slotId)
        }));
        setSelectedSlot("");
        setMessage("");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to book appointment. Please try again later.");
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-purple-50 py-12 px-4 flex flex-col items-center">
      <h2 className="font-['General_Sans'] font-semibold text-dark-blue900 text-3xl md:text-5xl mb-6 text-center">Find & Book a Doctor</h2>
      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8">
        {/* Doctor List */}
        <div className="flex-1 bg-white rounded-3xl shadow-md p-6">
          <h3 className="font-bold text-xl mb-4 text-dark-blue900">Available Doctors</h3>
          <div className="flex flex-col gap-6">
            {doctorsList.length === 0 ? (
              <div className="text-gray-500 italic p-4 text-center border border-dashed rounded-xl border-gray-300">
                No active doctors found in the system yet.
              </div>
            ) : (
              doctorsList.map((doc) => (
                <div key={doc._id} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer ${selectedDoctor?._id === doc._id ? 'border-purple-600 bg-purple-50' : 'border-gray-200'}`} onClick={async () => {
                  setSelectedDoctor(doc);
                  try {
                    const res = await axios.get(
                      apiUrl(`/api/doctor/profile/${doc.userId}`),
                      { withCredentials: true }
                    );
                    setSelectedDoctor(res.data);
                  } catch (e) { }
                }}>
                  <img src={doc.profilePic || "/assets/images/default-user.png"} alt={doc.name} className="w-16 h-16 rounded-full object-cover border-2 border-purple-200" />
                  <div>
                    <div className="font-bold text-lg text-dark-blue900">{doc.name}</div>
                    <div className="text-purple-700 font-medium">{doc.specialty}</div>
                    <div className="text-gray-500 text-sm">Experience: {doc.yearsOfExperience ? `${doc.yearsOfExperience} years` : "N/A"}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        {/* Doctor Profile & Booking */}
        <div className="flex-1 bg-white rounded-3xl shadow-md p-6">
          {selectedDoctor ? (
            <>
              <div className="flex flex-col items-center mb-4">
                <img src={selectedDoctor.profilePic || "/assets/images/default-user.png"} alt={selectedDoctor.name} className="w-24 h-24 rounded-full object-cover border-2 border-purple-200 mb-2" />
                <div className="font-bold text-xl text-dark-blue900">{selectedDoctor.name}</div>
                <div className="text-purple-700 font-medium">{selectedDoctor.specialty}</div>
                <div className="text-gray-500 text-sm">Experience: {selectedDoctor.yearsOfExperience ? `${selectedDoctor.yearsOfExperience} years` : "N/A"} | Reg No: {selectedDoctor.licenseNumber || "N/A"}</div>
                {selectedDoctor.qualifications && <div className="text-gray-600 font-medium text-sm mt-1">{selectedDoctor.qualifications}</div>}
                <p className="text-gray-700 mt-2 text-center">{selectedDoctor.bio}</p>
              </div>
              <div className="mb-4">
                <h4 className="font-semibold text-dark-blue900 mb-2">Book Appointment</h4>
                <div className="flex flex-col gap-4 mb-2 w-full">
                  {(() => {
                    if (!selectedDoctor.slots || selectedDoctor.slots.length === 0) {
                      return <div className="text-sm text-gray-500 italic">No available slots listed currently.</div>;
                    }

                    // Group slots by date
                    const slotsByDate = selectedDoctor.slots.reduce((acc, slot) => {
                      if (!acc[slot.date]) acc[slot.date] = [];
                      acc[slot.date].push(slot);
                      return acc;
                    }, {});

                    // Sort dates (optional: you could sort by string or Date object)
                    const sortedDates = Object.keys(slotsByDate).sort();

                    return sortedDates.map(date => (
                      <div key={date} className="w-full border border-gray-200 rounded-xl p-4 bg-gray-50 shadow-sm">
                        <div className="font-bold text-dark-blue900 mb-3 border-b border-gray-200 pb-2 text-lg">{date}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {slotsByDate[date].map((slot, idx) => {
                            const slotStr = `${slot.date} ${slot.startTime} - ${slot.endTime}`;
                            const isSelected = selectedSlot === slotStr;
                            return (
                              <button
                                key={idx}
                                className={`flex justify-start px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${isSelected ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-purple-700 border-purple-200 hover:bg-purple-100'}`}
                                onClick={() => setSelectedSlot(slotStr)}
                              >
                                <span className={isSelected ? 'text-purple-200 mr-2 font-bold' : 'text-purple-400 mr-2 font-bold'}>{idx + 1} -</span>
                                <span>{slot.startTime} - {slot.endTime}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
                <textarea className="w-full p-3 border border-gray-300 rounded-xl mb-4 mt-2 focus:ring-2 focus:ring-purple-500 outline-none placeholder-gray-400 resize-none" rows="3" placeholder="Additional notes or message to doctor (optional)" value={message} onChange={e => setMessage(e.target.value)} />
                <button
                  onClick={handleBookAppointment}
                  className="w-full py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50"
                  disabled={!selectedSlot || booking}
                >
                  {booking ? "Booking..." : "Confirm Appointment"}
                </button>
              </div>

            </>
          ) : (
            <div className="text-gray-500 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
              <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              Select a doctor from the list to view their complete profile and securely book your consultation.
            </div>
          )}

          {/* Patient's booked appointments displayed universally */}
          {myAppointments.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200 w-full">
              <h4 className="font-semibold text-dark-blue900 mb-4 text-xl">My Upcoming Appointments</h4>
              <div className="flex flex-col gap-3">
                {myAppointments.map((appt, idx) => (
                  <div key={idx} className="bg-green-50 border border-green-200 p-4 rounded-xl flex justify-between items-center shadow-sm">
                    <div>
                      <div className="font-bold text-green-900 text-lg">{appt.doctorName}</div>
                      <div className="text-green-800 font-medium">{appt.date} at {appt.time}</div>
                    </div>
                    <span className="bg-green-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-sm">{appt.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientBooking;
