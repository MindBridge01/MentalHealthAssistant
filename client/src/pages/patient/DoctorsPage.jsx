import { useEffect, useMemo, useState } from "react";
import DoctorCard from "../../components/patient/DoctorCard";
import PageHeader from "../../components/patient/PageHeader";
import { getDoctors } from "../../services/doctorService";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getDoctors()
      .then((response) => setDoctors(response))
      .catch((loadError) => setError(loadError.message));
  }, []);

  const filteredDoctors = useMemo(() => {
    const needle = query.toLowerCase().trim();
    if (!needle) return doctors;
    return doctors.filter((doctor) =>
      [doctor.name, doctor.specialty, doctor.bio].some((value) =>
        String(value || "").toLowerCase().includes(needle)
      )
    );
  }, [doctors, query]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Doctors"
        title="Find the support style that fits you"
        description="Browse available doctors, review their focus areas, and choose a time when you feel ready."
      />

      <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-soft">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)]"
          placeholder="Search by doctor name or specialty"
        />
      </div>

      {error ? <div className="rounded-2xl bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">{error}</div> : null}

      <div className="space-y-5">
        {filteredDoctors.map((doctor) => (
          <DoctorCard key={doctor.userId} doctor={doctor} />
        ))}
      </div>
    </div>
  );
}
