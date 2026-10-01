import React from "react";

const Payments = () => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 min-h-[500px] flex flex-col items-center justify-center p-8 text-center">
      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
        <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Payments & Payouts</h2>
      <p className="text-slate-500 max-w-md mx-auto">Track transactions, process refunds, and manage doctor payouts.</p>
      <button className="mt-6 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-slate-800">
        Configure Module
      </button>
    </div>
  );
};

export default Payments;
