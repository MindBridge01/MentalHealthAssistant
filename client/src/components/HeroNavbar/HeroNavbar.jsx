import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiUrl } from "../../config/api";

function AlertIcon({ className = "" }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 9v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function HeroNavbar({ theme = "light" }) {
  const { isAuthenticated, user, role, logout } = useAuth();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { label: "Home", to: "/" },
    { label: "AI Chat", to: "/ai-chat" },
    { label: "Community", to: isAuthenticated ? "/patient/community" : "/login/patient" },
    { label: "About", to: "/about" },
  ];

  const patientMenu = [
    { label: "Dashboard", to: "/patient/dashboard" },
    { label: "Appointments", to: "/patient/appointments" },
  ];

  const doctorMenu = [
    { label: "Doctor Dashboard", to: "/doctor/dashboard" },
  ];

  const adminMenu = [
    { label: "Admin Dashboard", to: "/admin/dashboard" },
  ];

  const roleLinks = role === "admin" ? adminMenu : role === "doctor" ? doctorMenu : patientMenu;

  const isLight = theme === "light";
  const isSticky = theme === "sticky"; // For white background pages

  const headerClass = isSticky 
    ? "bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-[100]" 
    : `border-y ${isLight ? "border-white/25" : "border-black/25"}`;
  
  const textClass = (isLight && !isSticky) ? "text-white" : "text-slate-900";
  const hoverTextClass = (isLight && !isSticky) ? "hover:text-white/75" : "hover:text-primary";
  const ringClass = (isLight && !isSticky) ? "focus-visible:ring-white" : "focus-visible:ring-primary";
  const logoSrc = (isLight && !isSticky) ? "/logoBlack&White.png" : "/logoColored.png";

  const handleSos = async () => {
    if (!user) {
      navigate("/login/patient", { state: { from: location.pathname } });
      return;
    }
    if (!window.confirm("Are you sure you want to trigger an SOS alert to your Guardian?")) return;

    try {
      const res = await fetch(apiUrl("/api/profile/sos"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        alert("SOS Alert Sent! Your guardian has been notified.");
      } else {
        alert(`SOS Failed: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while trying to send SOS.");
    }
  };

  return (
    <header className={`flex min-h-[101px] w-full items-center gap-6 ${headerClass} ${textClass} lg:gap-[100px] px-4 sm:px-6 lg:px-[25px]`}>
      <Link to="/" className={`shrink-0 focus:outline-none focus-visible:ring-2 ${ringClass}`}>
        <img src={logoSrc} alt="MindBridge" className="h-[64px] w-[90px] object-contain lg:h-[76px] lg:w-[161px]" />
      </Link>

      <div className={`flex min-h-[101px] flex-1 flex-col gap-5 py-4 lg:flex-row lg:items-center lg:justify-between ${!isSticky ? (isLight ? "lg:border-l lg:border-white/25" : "lg:border-l lg:border-black/25") : ""} lg:py-0`}>
        <nav
          className="flex flex-1 items-center justify-start px-0 lg:h-[101px] lg:justify-end lg:p-[10px]"
          aria-label="Primary navigation"
        >
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={`font-['Helvetica_Neue',Helvetica,sans-serif] text-sm font-medium leading-[16.8px] tracking-[0.42px] transition duration-200 ${textClass} ${hoverTextClass} focus:outline-none focus-visible:ring-2 ${ringClass}`}
              >
                {item.label}
              </Link>
            ))}
            {isAuthenticated && roleLinks.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={`font-['Helvetica_Neue',Helvetica,sans-serif] text-sm font-medium leading-[16.8px] tracking-[0.42px] transition duration-200 ${textClass} ${hoverTextClass} focus:outline-none focus-visible:ring-2 ${ringClass}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto lg:flex-nowrap">
          {isAuthenticated ? (
            <>
              {role === "patient" && (
                <button
                  onClick={handleSos}
                  className={`inline-flex min-h-[40px] items-center justify-center gap-[10px] rounded-[4px] bg-[#fdd5d3] px-6 py-2 text-sm font-bold text-red-600 transition duration-200 hover:bg-[#fac4c1] focus:outline-none focus-visible:ring-2 ${ringClass}`}
                >
                  <AlertIcon className="h-5 w-5 text-red-600" />
                  <span className="whitespace-nowrap uppercase tracking-wider">SOS Help</span>
                </button>
              )}
              
              <div className="relative ml-2" ref={userDropdownRef}>
                <button
                  className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 bg-slate-50 overflow-hidden"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                >
                  <img
                    src={user?.profilePic || "/assets/images/default-user.png"}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                </button>

                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-[110] py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-slate-50 mb-1">
                       <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">My Account</p>
                       <p className="text-sm font-medium text-slate-700 truncate">{user?.name}</p>
                    </div>
                    {role !== "doctor" && (
                      <Link
                        to="/profile-settings"
                        className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        Profile Settings
                      </Link>
                    )}
                    <button
                      className="block w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      onClick={async () => {
                        setIsUserDropdownOpen(false);
                        await logout();
                        navigate("/login", { replace: true });
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login/patient"
                className={`flex min-h-[40px] flex-1 whitespace-nowrap items-center justify-center rounded-[4px] bg-[#2e2f6b] px-8 py-2 text-center text-base font-medium text-white transition duration-200 hover:bg-[#252659] focus:outline-none focus-visible:ring-2 ${ringClass}`}
              >
                Log In
              </Link>
              <Link
                to="/login/patient"
                className={`inline-flex min-h-[40px] items-center justify-center gap-[10px] rounded-[4px] bg-[#fdd5d3] px-8 py-2 text-base font-medium text-red-600 transition duration-200 hover:bg-[#fac4c1] focus:outline-none focus-visible:ring-2 ${ringClass}`}
              >
                <AlertIcon className="h-6 w-6 text-red-600" />
                <span className="whitespace-nowrap text-red-600">Immediate Support</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
