import React from "react";

const MentalHealthContent = () => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 min-h-[500px] flex flex-col items-center justify-center p-8 text-center">
      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
        <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Mental Health Content</h2>
      <p className="text-slate-500 max-w-md mx-auto">Manage articles, emergency resources, and content for the AI Assistant.</p>
      <button className="mt-6 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-slate-800">
        Configure Module
      </button>
    </div>
  );
};

export default MentalHealthContent;
