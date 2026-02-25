import React, { useState } from "react";

// Sample data for doctors (replace with API data in production)
const doctors = [
  {
    id: 1,
    name: "Dr. Jane Smith",
    specialty: "Clinical Psychologist",
    bio: "10+ years helping adults and teens with anxiety, depression, and trauma recovery.",
    photo: "/assets/images/doctor1.png",
    languages: ["English", "Spanish"],
    experience: "10 years",
    reviews: 4.8,
    availableSlots: ["2026-02-12 10:00", "2026-02-12 14:00", "2026-02-13 09:00"]
  },
  {
    id: 2,
    name: "Dr. John Lee",
    specialty: "Psychiatrist",
    bio: "Specializes in mood disorders and medication management.",
    photo: "/assets/images/doctor2.png",
    languages: ["English", "Hindi"],
    experience: "8 years",
    reviews: 4.6,
    availableSlots: ["2026-02-12 11:00", "2026-02-13 15:00"]
  }
];

const DoctorDashboard = () => {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [message, setMessage] = useState("");
  const [showSOS, setShowSOS] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);

  return (
    <div className="w-full min-h-screen bg-purple-50 py-12 px-4 flex flex-col items-center">
      <h2 className="font-['General_Sans'] font-semibold text-dark-blue900 text-3xl md:text-5xl mb-6 text-center">Find & Book a Doctor</h2>
      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8">
        {/* Doctor List */}
        <div className="flex-1 bg-white rounded-3xl shadow-md p-6">
          <h3 className="font-bold text-xl mb-4 text-dark-blue900">Available Doctors</h3>
          <div className="flex flex-col gap-6">
            {doctors.map((doc) => (
              <div key={doc.id} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer ${selectedDoctor?.id === doc.id ? 'border-purple-600 bg-purple-50' : 'border-gray-200'}`} onClick={() => setSelectedDoctor(doc)}>
                <img src={doc.photo} alt={doc.name} className="w-16 h-16 rounded-full object-cover border-2 border-purple-200" />
                <div>
                  <div className="font-bold text-lg text-dark-blue900">{doc.name}</div>
                  <div className="text-purple-700 font-medium">{doc.specialty}</div>
                  <div className="text-gray-500 text-sm">{doc.languages.join(", ")} | {doc.experience} | ⭐ {doc.reviews}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Doctor Profile & Booking */}
        <div className="flex-1 bg-white rounded-3xl shadow-md p-6">
          {selectedDoctor ? (
            <>
              <div className="flex flex-col items-center mb-4">
                <img src={selectedDoctor.photo} alt={selectedDoctor.name} className="w-24 h-24 rounded-full object-cover border-2 border-purple-200 mb-2" />
                <div className="font-bold text-xl text-dark-blue900">{selectedDoctor.name}</div>
                <div className="text-purple-700 font-medium">{selectedDoctor.specialty}</div>
                <div className="text-gray-500 text-sm">{selectedDoctor.languages.join(", ")} | {selectedDoctor.experience} | ⭐ {selectedDoctor.reviews}</div>
                <p className="text-gray-700 mt-2 text-center">{selectedDoctor.bio}</p>
              </div>
              <div className="mb-4">
                <h4 className="font-semibold text-dark-blue900 mb-2">Book Appointment</h4>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedDoctor.availableSlots.map((slot) => (
                    <button key={slot} className={`px-3 py-1 rounded-lg border ${selectedSlot === slot ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 border-purple-200'}`} onClick={() => setSelectedSlot(slot)}>{slot}</button>
                  ))}
                </div>
                <textarea className="w-full p-2 border border-gray-300 rounded-md mb-2" rows="2" placeholder="Message to doctor (optional)" value={message} onChange={e => setMessage(e.target.value)} />
                <button className="w-full py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold" disabled={!selectedSlot}>Confirm Appointment</button>
              </div>
            </>
          ) : (
            <div className="text-gray-500 text-center">Select a doctor to view details and book an appointment.</div>
          )}
          <div className="mt-6 flex flex-col gap-2">
            <button className="w-full py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold" onClick={() => setShowSOS(true)}>Emergency / SOS</button>
            <button className="w-full py-2 rounded-md bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold" onClick={() => setShowFAQ(true)}>FAQ / Guidance</button>
          </div>
        </div>
      </div>
      {/* SOS Modal */}
      {showSOS && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
            <h3 className="text-2xl font-bold text-red-600 mb-4">Emergency Help</h3>
            <p className="mb-4">If you are in crisis or need immediate help, please call your local emergency number or a mental health hotline.</p>
            <button className="mt-2 px-6 py-2 bg-red-600 text-white rounded-lg font-bold" onClick={() => setShowSOS(false)}>Close</button>
          </div>
        </div>
      )}
      {/* FAQ Modal */}
      {showFAQ && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
            <h3 className="text-2xl font-bold text-purple-700 mb-4">FAQ & Guidance</h3>
            <ul className="text-left list-disc pl-6 mb-4">
              <li>All consultations are private and confidential.</li>
              <li>You can choose video, voice, or chat for your session.</li>
              <li>Payment and insurance details will be discussed before your session.</li>
              <li>If you need to reschedule, please contact your doctor in advance.</li>
            </ul>
            <button className="mt-2 px-6 py-2 bg-purple-600 text-white rounded-lg font-bold" onClick={() => setShowFAQ(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
