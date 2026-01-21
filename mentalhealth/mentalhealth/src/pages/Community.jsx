import React, { useState } from "react";
import PostWall from "./Postwall";
import UploadSec from "./UploadSec";
import NavBar from "../components/NavBar/NavBar";
import HeroSection from "./communityHero";
import Footer from '../components/Footer/Footer';

import Ellipse3 from "../assets/Elipses/Ellipse3.png";
import Ellipse4 from "../assets/Elipses/Ellipse4.png";
import Ellipse5 from "../assets/Elipses/Ellipse5.png";

const CommunitySection = () => {
  const [refresh, setRefresh] = useState(0);

  const handlePostUpload = () => {
    setRefresh((prev) => prev + 1);
  };

  return (
    <div className="relative w-full overflow-hidden min-h-screen ">
      {/* Background Ellipses */}
      <div className="absolute inset-0 flex justify-center items-center z-[-1] w-full overflow-hidden">
        <div
          className="relative w-[1242px] h-[1242px] bg-cover"
          style={{ backgroundImage: `url(${Ellipse5})`, top: "100px" }}
        >
          <div
            className="relative w-[1347px] h-[1499px] top-[-1800px] left-[5%] md:left-[138px] bg-cover"
            style={{ backgroundImage: `url(${Ellipse4})` }}
          >
            <img
              className="absolute w-full max-w-[982px] h-auto top-[300px] left-[10%] md:left-[195px]"
              alt="Ellipse"
              src={Ellipse3}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-8 md:px-[156px] relative z-10">
        <NavBar />
        <HeroSection />
        <PostWall key={refresh} />
        <UploadSec onPostUpload={handlePostUpload} />
      </div>
      <Footer/>
    </div>
  );
};

export default CommunitySection;
