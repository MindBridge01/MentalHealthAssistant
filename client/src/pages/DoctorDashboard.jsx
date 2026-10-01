import { useEffect, useState } from "react";
import { apiRequest } from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: "", startTime: "", endTime: "" });

  async function loadDashboardData() {
    if (!user?._id) return;
    try {
      const [slotsRes, appointmentsRes] = await Promise.all([
        apiRequest(`/api/doctor/slots/${user._id}`),
        apiRequest(`/api/doctor/appointments/${user._id}`),
      ]);
      setSlots(slotsRes.slots || []);
      setAppointments(appointmentsRes.appointments || []);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load doctor dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const handleCreateSlot = async (event) => {
    event.preventDefault();
    try {
      await apiRequest(`/api/doctor/slots/${user._id}`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm({ date: "", startTime: "", endTime: "" });
      await loadDashboardData();
    } catch (err) {
      setError(err.message || "Failed to create slot.");
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      await apiRequest(`/api/doctor/slots/${user._id}/${slotId}`, {
        method: "DELETE",
      });
      setSlots((prev) => prev.filter((slot) => String(slot._id) !== String(slotId)));
    } catch (err) {
      setError(err.message || "Failed to delete slot.");
    }
  };

  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-900">Doctor Dashboard</h1>
      <p className="text-slate-600 mt-2">Manage appointment slots and review patient appointments.</p>

      {loading && <p className="text-slate-500 mt-4">Loading dashboard...</p>}
      {!loading && error && <p className="text-red-600 mt-4">{error}</p>}

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-xl font-semibold text-slate-900">Manage Slots</h2>
          <form onSubmit={handleCreateSlot} className="space-y-3 mt-4">
            <input
              type="date"
              value={form.date}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              className="w-full border border-slate-300 rounded-lg p-2"
              required
            />
            <input
              type="time"
              value={form.startTime}
              onChange={(event) => setForm((prev) => ({ ...prev, startTime: event.target.value }))}
              className="w-full border border-slate-300 rounded-lg p-2"
              required
            />
            <input
              type="time"
              value={form.endTime}
              onChange={(event) => setForm((prev) => ({ ...prev, endTime: event.target.value }))}
              className="w-full border border-slate-300 rounded-lg p-2"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-sky-700 text-white hover:bg-sky-800"
            >
              Add Slot
            </button>
          </form>

          <ul className="mt-5 space-y-2">
            {slots.length === 0 && <li className="text-slate-500">No slots available.</li>}
            {slots.map((slot) => (
              <li key={slot._id || `${slot.date}-${slot.startTime}`} className="flex items-center justify-between border border-slate-200 rounded-lg p-3">
                <span className="text-sm text-slate-700">{slot.date} {slot.startTime} - {slot.endTime}</span>
                <button
                  onClick={() => handleDeleteSlot(slot._id)}
                  className="text-sm px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-xl font-semibold text-slate-900">Patient Appointments</h2>
          <ul className="mt-4 space-y-2">
            {appointments.length === 0 && <li className="text-slate-500">No appointments yet.</li>}
            {appointments.map((appointment) => (
              <li key={appointment._id || appointment.id} className="border border-slate-200 rounded-lg p-3">
                <p className="font-medium text-slate-900">{appointment.patient || "Patient"}</p>
                <p className="text-sm text-slate-600">{appointment.date} at {appointment.time}</p>
                <p className="text-xs text-slate-500 mt-1">Status: {appointment.status || "Upcoming"}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
