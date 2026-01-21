// Footer.jsx
import React from "react";
import logolight from "../../assets/logo/logolight.png";
import facebookBlack from "../../assets/images/facebook-black.png";
import Shape from "../../assets/images/Shape.png";
import twitterBlack from "../../assets/images/twitter-black.png";
import vimeoBlack from "../../assets/images/vimeo-black.png";

const Footer = () => {
  return (
    <div className="w-full bg-white relative">
      <img
        className="absolute w-full h-[209px] top-0 left-0 object-cover"
        alt="Shape"
        src={Shape}
      />

      <div className="relative z-10 pt-36 pb-10 px-4 md:px-10 max-w-screen-xl mx-auto flex flex-col items-center text-center">
        {/* Subscribe Section */}
{/* Subscribe Section */}
<div className="w-full bg-dark-blue900 rounded-[10px] p-6 md:p-10 shadow-md flex flex-col items-center gap-6 text-white">
  <h2 className="text-2xl md:text-3xl font-semibold text-center">
    Subscribe Newsletters
  </h2>

  <form className="w-full max-w-xl flex flex-col sm:flex-row items-center gap-4">
    <input
      type="email"
      required
      placeholder="Enter your email"
      className="flex-1 w-full bg-white px-4 py-3 rounded text-gray-900 text-sm outline-none"
    />
    <button
      type="submit"
      className="px-6 py-3 bg-blue-100 hover:bg-blue-700 transition text-blue-900 rounded text-sm font-medium w-full sm:w-auto"
    >
      Subscribe Now
    </button>
  </form>
</div>


        {/* Links + Social Media */}
        <div className="w-full flex flex-col gap-8 mt-16">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-base font-medium text-dark">
              <span>About us</span>
              <span>Discover</span>
              <span>Explore</span>
              <span>Books</span>
            </div>

            <div className="flex gap-4">
              <img className="w-6 h-6" src={facebookBlack} alt="Facebook" />
              <img className="w-6 h-5" src={twitterBlack} alt="Twitter" />
              <img className="w-6 h-5" src={vimeoBlack} alt="Vimeo" />
              <div className="w-6 h-5 bg-[url('/youtube.svg')] bg-contain bg-no-repeat" />
            </div>
          </div>

          <div className="h-px w-full bg-gray-300" />

          {/* Bottom row */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm text-gray-600 text-center">
              © 2025 Mind Bridge. All rights reserved.
            </p>
            <img src={logolight} alt="Logo" className="w-[100px] h-auto" />
            <div className="flex gap-6 text-sm font-medium text-dark">
              <span>Terms of Service</span>
              <span>Privacy Policy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
