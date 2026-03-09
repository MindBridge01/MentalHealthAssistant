import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAppointments() {
      if (!user?._id) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiRequest(`/api/doctor/patient-appointments/${user._id}`);
        setAppointments(data.appointments || []);
      } catch (err) {
        setError(err.message || "Failed to load appointments.");
      } finally {
        setLoading(false);
      }
    }

    loadAppointments();
  }, [user?._id]);

  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-900">Patient Dashboard</h1>
      <p className="text-slate-600 mt-2">
        Manage your profile, chat with the assistant, and track your appointments.
      </p>

      <div className="grid md:grid-cols-3 gap-4 mt-8">
        <Link to="/ai-chat" className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-sky-400">
          <h2 className="font-semibold text-slate-900">AI Chat Assistant</h2>
          <p className="text-sm text-slate-600 mt-1">Start a secure chat session.</p>
        </Link>
        <Link to="/profile-settings" className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-sky-400">
          <h2 className="font-semibold text-slate-900">Manage Profile</h2>
          <p className="text-sm text-slate-600 mt-1">Update your personal details.</p>
        </Link>
        <Link to="/doctor-dashboard" className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-sky-400">
          <h2 className="font-semibold text-slate-900">Book Appointments</h2>
          <p className="text-sm text-slate-600 mt-1">Find doctors and reserve slots.</p>
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 mt-8">
        <h2 className="text-xl font-semibold text-slate-900">My Appointments</h2>
        {loading && <p className="text-slate-500 mt-3">Loading appointments...</p>}
        {!loading && error && <p className="text-red-600 mt-3">{error}</p>}
        {!loading && !error && appointments.length === 0 && (
          <p className="text-slate-500 mt-3">No appointments scheduled yet.</p>
        )}
        {!loading && !error && appointments.length > 0 && (
          <ul className="mt-4 space-y-2">
            {appointments.map((appointment) => (
              <li key={appointment._id || `${appointment.date}-${appointment.time}`} className="border border-slate-200 rounded-lg p-3">
                <p className="font-medium text-slate-900">{appointment.doctorName || "Doctor"}</p>
                <p className="text-sm text-slate-600">{appointment.date} at {appointment.time}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
