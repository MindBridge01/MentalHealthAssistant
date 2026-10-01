import React from "react";

const Patients = () => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 min-h-[500px] flex flex-col items-center justify-center p-8 text-center">
      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
        <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Patient Management</h2>
      <p className="text-slate-500 max-w-md mx-auto">View and manage all registered patients, handle support tickets, and review activity logs.</p>
      <button className="mt-6 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-slate-800">
        Configure Module
      </button>
    </div>
  );
};

export default Patients;
