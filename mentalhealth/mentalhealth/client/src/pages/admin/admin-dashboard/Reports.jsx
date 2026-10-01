import React from "react";

const Reports = () => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 min-h-[500px] flex flex-col items-center justify-center p-8 text-center">
      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
        <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Reports & Analytics</h2>
      <p className="text-slate-500 max-w-md mx-auto">Detailed charts on user growth, appointment completion rates, and platform revenue.</p>
      <button className="mt-6 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-slate-800">
        Configure Module
      </button>
    </div>
  );
};

export default Reports;
