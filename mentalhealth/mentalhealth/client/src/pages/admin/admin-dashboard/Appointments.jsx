import React from "react";

const Appointments = () => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 min-h-[500px] flex flex-col items-center justify-center p-8 text-center">
      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
        <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Appointment Management</h2>
      <p className="text-slate-500 max-w-md mx-auto">Global view of all appointments across the platform. Filter by date, doctor, or status.</p>
      <button className="mt-6 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-slate-800">
        Configure Module
      </button>
    </div>
  );
};

export default Appointments;
