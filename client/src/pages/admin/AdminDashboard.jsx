import React, { useEffect, useState } from "react";
import axios from "axios";
import { apiUrl } from "../../config/api";
import { useAuth } from "../../context/AuthContext";

import Overview from "./admin-dashboard/Overview";
import Verification from "./admin-dashboard/Verification";
import Doctors from "./admin-dashboard/Doctors";
import Patients from "./admin-dashboard/Patients";
import Appointments from "./admin-dashboard/Appointments";
import Calendar from "./admin-dashboard/Calendar";
import Payments from "./admin-dashboard/Payments";
import Reports from "./admin-dashboard/Reports";
import MentalHealthContent from "./admin-dashboard/MentalHealthContent";

const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState("dashboard");
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { logout } = useAuth();

  useEffect(() => {
    Promise.all([
      axios.get(apiUrl("/api/admin/pending-doctors"), { withCredentials: true }),
      axios.get(apiUrl("/api/admin/users"), { withCredentials: true }),
    ])
      .then(([pendingRes, usersRes]) => {
        setPendingDoctors(pendingRes.data);
        setUsers(usersRes.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load admin data.");
        setLoading(false);
      });
  }, []);

  const handleApprove = (doctorId) => {
    axios.post(
      apiUrl("/api/admin/approve-doctor"),
      { doctorId },
      { withCredentials: true }
    )
      .then(() => {
        setPendingDoctors(prev => prev.filter(d => d._id !== doctorId));
        setUsers(prev => prev.map((user) => (
          user._id === doctorId ? { ...user, role: "doctor" } : user
        )));
      })
      .catch(() => {
        setError("Failed to approve doctor.");
      });
  };

  const handleReject = (doctorId) => {
    axios.post(
      apiUrl("/api/admin/reject-doctor"),
      { doctorId },
      { withCredentials: true }
    )
      .then(() => {
        setPendingDoctors(prev => prev.filter(d => d._id !== doctorId));
        setUsers(prev => prev.filter((user) => user._id !== doctorId));
      })
      .catch(() => {
        setError("Failed to reject doctor.");
      });
  };

  const stats = {
    doctors: users.filter(u => u.role === 'doctor').length || 48,
    patients: users.filter(u => u.role === 'patient').length || 1245,
    bookings: 328, // Placeholder
    pending: pendingDoctors.length
  };

  // ---------------- Views ----------------
  const renderContent = () => {
    switch (currentView) {
      case "dashboard": return <Overview stats={stats} loading={loading} pendingDoctors={pendingDoctors} setCurrentView={setCurrentView} />;
      case "verification": return <Verification pendingDoctors={pendingDoctors} loading={loading} handleApprove={handleApprove} handleReject={handleReject} />;
      case "doctors": return <Doctors />;
      case "patients": return <Patients />;
      case "appointments": return <Appointments />;
      case "calendar": return <Calendar />;
      case "payments": return <Payments />;
      case "reports": return <Reports />;
      case "content": return <MentalHealthContent />;
      default: return <Overview stats={stats} loading={loading} pendingDoctors={pendingDoctors} setCurrentView={setCurrentView} />;
    }
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { id: "doctors", label: "Doctors", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
    { id: "verification", label: "Verification", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    { id: "patients", label: "Patients", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
    { id: "appointments", label: "Appointments", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { id: "calendar", label: "Calendar", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { id: "payments", label: "Payments", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { id: "reports", label: "Reports", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { id: "content", label: "Mental Health Content", icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex-col hidden md:flex shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2 text-sky-700 font-bold text-xl">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            <span>MindBridge</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {menuItems.slice(0, 8).map(item => (
            <button 
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                currentView === item.id 
                  ? "bg-sky-50 text-sky-700" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <svg className={`w-5 h-5 shrink-0 ${currentView === item.id ? "text-sky-600" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {item.label}
              {item.id === "verification" && pendingDoctors.length > 0 && (
                <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {pendingDoctors.length}
                </span>
              )}
            </button>
          ))}

          <div className="pt-4 mt-4 border-t border-slate-200 space-y-1">
            <button 
              onClick={() => setCurrentView("content")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                currentView === "content" 
                  ? "bg-sky-50 text-sky-700" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <svg className={`w-5 h-5 shrink-0 ${currentView === "content" ? "text-sky-600" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuItems[8].icon} />
              </svg>
              Mental Health Content
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* TOP HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6 ml-6">
            <button className="text-slate-400 hover:text-slate-600 relative transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {pendingDoctors.length > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900 leading-tight">Admin</p>
                <p className="text-xs text-slate-500">System Admin</p>
              </div>
              <button 
                onClick={logout} 
                className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold border border-sky-200 hover:bg-sky-200 transition-colors shadow-sm"
                title="Logout"
              >
                A
              </button>
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT BODY */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 capitalize">
                {currentView === 'dashboard' ? 'Overview' : currentView.replace('-', ' ')}
              </h1>
              <p className="text-slate-500 text-sm mt-1">Manage and monitor the MindBridge platform</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {error}
            </div>
          )}

          {renderContent()}

        </main>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
      `}} />
    </div>
  );
};



export default AdminDashboard;
