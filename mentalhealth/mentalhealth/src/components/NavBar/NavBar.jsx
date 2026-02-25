import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logolight from "../../assets/logo/logolight.png";
import { ButtonPrimary } from "../Buttons/ButtonPrimary/ButtonPrimary";

/* ================= DROPDOWN COMPONENT ================= */
const Dropdown = ({ label, options }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      className="relative inline-block text-left z-50"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex items-center justify-center gap-2.5 p-2.5 text-xl font-medium text-dark-blue900"
        type="button"
      >
        {label}
        <svg
          className={`w-4 h-4 ml-1 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute z-[999] pt-2 w-48">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {options.map((opt) => (
              <button
                key={opt.label}
                className="block w-full text-left px-4 py-2 text-dark-blue900 hover:bg-purple-50 cursor-pointer"
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate(opt.to);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ================= NAVBAR ================= */
const NavBar = ({ user }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // mobile menu
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false); // profile dropdown

  return (
    <div className="flex w-full max-w-[1435px] items-center justify-between relative px-4 py-4">
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
          } md:flex flex-col md:flex-row gap-[34px] items-center absolute md:static top-16 left-0 w-full md:w-auto bg-white md:bg-transparent p-4 md:p-0 z-50`}
      >
        {/* Links */}
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

        {/* Login Dropdown */}
        <Dropdown
          label="Login"
          options={[
            { label: "Login as User", to: "/login/user" },
            { label: "Login as Doctor", to: "/login/doctor" },
            { label: "Login as Admin", to: "/login/admin" },
          ]}
        />

        {/* Signup Dropdown */}
        <Dropdown
          label="Signup"
          options={[
            { label: "Signup as User", to: "/signup/user" },
            { label: "Signup as Doctor", to: "/signup/doctor" },
          ]}
        />

        {/* Buttons */}
        <div className="flex gap-2 mt-4 md:mt-0">
          <button
            className="px-4 py-2 bg-red-600 rounded-2xl flex items-center gap-2.5 hover:bg-red-700"
            onClick={() => alert("SOS Triggered!")}
          >
            <span className="material-icons text-white text-lg">report</span>
            <div className="text-white text-lg font-bold">SOS Help</div>
          </button>

          <ButtonPrimary />
        </div>

        {/* User Profile */}
        <div className="relative ml-4">
          <button
            className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 border border-purple-200"
            onClick={(e) => {
              e.stopPropagation();
              setIsUserDropdownOpen((prev) => !prev);
            }}
          >
            <img
              src={user?.profilePic || "/assets/images/default-user.png"}
              alt="User"
              className="w-8 h-8 rounded-full object-cover"
            />
          </button>

          {isUserDropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-[999]">
              <div
                className="block px-4 py-2 hover:bg-purple-50 cursor-pointer"
                onClick={() => {
                  setIsUserDropdownOpen(false);
                  window.location.href = "/profile-settings";
                }}
              >
                Edit Profile
              </div>

              <button
                className="block w-full text-left px-4 py-2 hover:bg-purple-50 cursor-pointer"
                onClick={() => {
                  setIsUserDropdownOpen(false);
                  localStorage.removeItem("user");
                  window.location.href = "/";
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavBar;