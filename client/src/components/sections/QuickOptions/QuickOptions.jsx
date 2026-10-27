import React from "react";
import { useNavigate } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import Quickoptioncard from "../../Quickoptioncard/Quickoptioncard";

import chatScreen from "../../../assets/product/ai-chat.png";
import community from "../../../assets/landing-stock/connection.jpg";
import doctor from "../../../assets/images/doctor.png";

const QuickOptions = () => {
  const [ref1, inView1] = useInView({ triggerOnce: true });
  const [ref2, inView2] = useInView({ triggerOnce: true });
  const [ref3, inView3] = useInView({ triggerOnce: true });

  const navigate = useNavigate();
  return (
    <div id="find-support" className="landing-support landing-section">
      <p className="landing-section-label">02 / FIND YOUR SUPPORT</p>
      <div className="landing-section-heading">
        <h2 className="text-center text-dark-blue900 text-5xl sm:text-7xl font-thin leading-[1.05] tracking-[-0.04em]" style={{ fontFamily: '"Editor\'s Note"', fontWeight: 50 }}>
          Choose the support that fits.
        </h2>
        <p className="text-center font-[Satoshi] font-normal text-dark-blue900 text-lg sm:text-2xl">
          Reflect with AI, explore professional care, or connect with other members.
        </p>
      </div>

      {/* Cards */}
      <div className="landing-support-grid">
        <div
          ref={ref1}
          className={`transition duration-1000 ${
            inView1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <Quickoptioncard
            imageSrc={doctor}
            title="Find a professional"
            description="Review published profiles, qualifications, hospital locations, and available appointment slots. Patient registration approval is required to request an appointment."
            buttonText="Browse professionals"
            onClick={() => navigate("/patient/doctors")}
          />
        </div>
        <div
          ref={ref2}
          className={`transition duration-1000 ${
            inView2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <Quickoptioncard
            imageSrc={community}
            title="Join Our Community"
            description="Read and share reflections with other signed-in members. Posts, comments, and profile information you share are visible within the community."
            buttonText="Join Community"
            onClick={() => navigate("/patient/community")}
          />
        </div>
        <div
          ref={ref3}
          className={`transition duration-1000 ${
            inView3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          } border-2 rounded-[24px] border-red-300`}
        >
          <Quickoptioncard
            imageSrc={chatScreen}
            title="Reflect with AI"
            description="Try an automated conversation for reflection and general support. No account is needed. AI responses are not a diagnosis or professional advice."
            buttonText="Try AI chat"
            onClick={() => navigate("/ai-chat")}
          />
        </div>
      </div>
    </div>
  );
};

export default QuickOptions;
