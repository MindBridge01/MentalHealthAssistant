import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import logolight from "../../assets/logo/logolight.png";
import { ButtonPrimary } from "../Buttons/ButtonPrimary/ButtonPrimary";
import { apiUrl } from "../../config/api";
import { useAuth } from "../../context/AuthContext";



/* ================= NAVBAR ================= */
const NavBar = ({ user }) => {
  const { isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // mobile menu
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false); // profile dropdown
  const userDropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const patientMenu = [
    { label: "Patient Dashboard", to: "/patient/dashboard" },
    { label: "Profile", to: "/profile-settings" },
    { label: "Chat Assistant", to: "/ai-chat" },
    { label: "Appointments", to: "/doctor-dashboard" },
  ];

  const doctorMenu = [
    { label: "Doctor Dashboard", to: "/doctor/dashboard" },
    { label: "Manage Appointments", to: "/doctor/dashboard" },
    { label: "Manage Slots", to: "/doctor/dashboard" },
  ];

  const adminMenu = [
    { label: "Admin Dashboard", to: "/admin/dashboard" },
    { label: "Approve Doctors", to: "/admin/dashboard" },
    { label: "Manage Users", to: "/admin/dashboard" },
  ];

  const roleLinks = user?.role === "admin" ? adminMenu : user?.role === "doctor" ? doctorMenu : patientMenu;

  return (
    <div className="flex w-full max-w-[1435px] mx-auto items-center justify-between relative px-4 py-4">
      {/* Logo */}
      <img src={logolight} alt="Logo" className="w-[72px] h-auto" />

      {/* Burger Icon */}
      <button
        className="md:hidden flex items-center justify-center w-10 h-10"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle navigation menu"
      >
        <svg
          className="w-6 h-6 text-dark-blue900"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
          />
        </svg>
      </button>

      {/* Navigation */}
      <div
        className={`${isMenuOpen ? "flex" : "hidden"
          } md:flex flex-col md:flex-row items-center justify-between absolute md:static top-16 left-0 w-full bg-white md:bg-transparent p-4 md:p-0 z-50 md:flex-1`}
      >
        {/* Links - Centered on Desktop */}
        <div className="flex flex-col md:flex-row gap-[34px] items-center md:absolute md:left-1/2 md:-translate-x-1/2 md:w-auto w-full border-b border-gray-100 md:border-none pb-6 md:pb-0">
          <Link to="/" className="p-2.5 text-xl font-medium text-dark-blue900">
            Home
          </Link>

          <Link
            to="/community"
            className="p-2.5 text-xl font-medium text-dark-blue900"
          >
            Community
          </Link>

          <Link to="/about" className="p-2.5 text-xl font-medium text-dark-blue900">
            About
          </Link>

          {!isAuthenticated && (
            <Link to="/login" className="p-2.5 text-xl font-medium text-dark-blue900">
              Login
            </Link>
          )}

          {!isAuthenticated && (
            <Link to="/signup" className="p-2.5 text-xl font-medium text-dark-blue900">
              Signup
            </Link>
          )}

          {isAuthenticated && roleLinks.map((item) => (
            <Link key={item.label} to={item.to} className="p-2.5 text-xl font-medium text-dark-blue900">
              {item.label}
            </Link>
          ))}
        </div>

        {/* Buttons and Profile */}
        <div className="flex flex-col md:flex-row gap-4 mt-6 md:mt-0 items-center md:ml-auto w-full md:w-auto justify-center">
          {/* Buttons */}
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-red-600 rounded-2xl flex items-center gap-2.5 hover:bg-red-700"
              onClick={async () => {
                if (!user) {
                  alert("Please login first to trigger SOS.");
                  return;
                }
                if (!window.confirm("Are you sure you want to trigger an SOS alert to your Guardian?")) return;

                try {
                  const res = await fetch(apiUrl("/api/profile/sos"), {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
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
              }}
            >
              <span className="material-icons text-white text-lg">report</span>
              <div className="text-white text-lg font-bold">SOS Help</div>
            </button>

            <ButtonPrimary />
          </div>

          {/* User Profile */}
          {user && (
            <div className="relative md:ml-4" ref={userDropdownRef}>
              <button
                className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 border border-purple-200"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsUserDropdownOpen((prev) => !prev);
                }}
              >
                <img
                  src={user.profilePic || "/assets/images/default-user.png"}
                  alt="User"
                  className="w-8 h-8 rounded-full object-cover"
                />
              </button>

              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-[999]">
                  {user.role !== "doctor" && (
                    <div
                      className="block px-4 py-2 hover:bg-purple-50 cursor-pointer"
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        window.location.href = "/profile-settings";
                      }}
                    >
                      Edit Profile
                    </div>
                  )}

                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-purple-50 cursor-pointer"
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
          )}
        </div>
      </div>
    </div>
  );
};

export default NavBar;
