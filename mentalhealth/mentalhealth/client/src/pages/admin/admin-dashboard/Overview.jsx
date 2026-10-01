import React from "react";

const StatCard = ({ title, value, icon, color, trend }) => {
  const colorMap = {
    sky: "bg-sky-100 text-sky-600",
    emerald: "bg-emerald-100 text-emerald-600",
    indigo: "bg-indigo-100 text-indigo-600",
    amber: "bg-amber-100 text-amber-600",
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2">{value}</h3>
        </div>
        <div className={`p-3 rounded-2xl ${colorMap[color]}`}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
      </div>
      <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 border-t border-slate-100 pt-3">
        {trend.includes('+') ? (
           <span className="text-emerald-600 flex items-center gap-1">
             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
             {trend}
           </span>
        ) : title === "Pending Verifications" ? (
           <span className="text-amber-600">{trend}</span>
        ) : (
           <span>{trend}</span>
        )}
      </p>
    </div>
  );
};

const Overview = ({ stats, loading, pendingDoctors, setCurrentView }) => {
  return (
    <div className="space-y-6">
      {/* 4 KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Doctors" value={loading ? "..." : stats.doctors} icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" color="sky" trend="+8 this month" />
        <StatCard title="Patients" value={loading ? "..." : stats.patients} icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" color="emerald" trend="+15%" />
        <StatCard title="Appointments" value={stats.bookings} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" color="indigo" trend="This month" />
        <StatCard title="Pending Verifications" value={stats.pending} icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" color="amber" trend="Action required" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Appointment Statistics</h2>
            <select className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer">
              <option>This Year</option>
              <option>This Month</option>
              <option>This Week</option>
            </select>
          </div>
          <div className="h-64 flex items-end justify-between gap-2 px-2">
            {[40, 60, 45, 80, 55, 90, 75, 100, 85, 110, 95, 120].map((h, i) => (
              <div key={i} className="w-full bg-sky-100 rounded-t-lg relative group">
                <div 
                  className="absolute bottom-0 w-full bg-sky-500 rounded-t-lg transition-all duration-500 group-hover:bg-sky-400" 
                  style={{ height: `${h}%` }}
                ></div>
                <div className="absolute -bottom-6 w-full text-center text-xs text-slate-400">
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i]}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-slate-100 pt-4 flex gap-6">
             <div className="flex items-center gap-2 text-sm text-slate-600"><span className="w-3 h-3 bg-sky-500 rounded-full"></span> Completed</div>
             <div className="flex items-center gap-2 text-sm text-slate-600"><span className="w-3 h-3 bg-sky-200 rounded-full"></span> Scheduled</div>
          </div>
        </div>

        {/* Quick Actions & Notifications */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Recent Alerts</h2>
          <div className="space-y-4 flex-1">
            {pendingDoctors.length > 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-600 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{pendingDoctors.length} Doctors waiting for verification</p>
                  <button onClick={() => setCurrentView('verification')} className="text-xs text-amber-600 font-semibold mt-1 hover:underline">Review Applications &rarr;</button>
                </div>
              </div>
            ) : null}
            <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-sky-100 rounded-lg text-sky-600 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">System backup completed</p>
                <p className="text-xs text-slate-500 mt-0.5">Today at 4:00 AM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
