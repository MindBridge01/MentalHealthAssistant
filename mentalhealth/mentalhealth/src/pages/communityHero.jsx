import React, { useEffect, useState } from "react";
import post1 from "../assets/images/post1.jpg";
import post2 from "../assets/images/post2.jpg";
import post3 from "../assets/images/post3.jpg";
import post4 from "../assets/images/post4.jpg";
import post5 from "../assets/images/post5.jpg";
import post6 from "../assets/images/post6.jpg";
import Shape from "../assets/images/Shape.png";

const images = [post1, post2, post3, post4, post5, post6, Shape];

const HeroSection = () => {
  const [circles, setCircles] = useState(
    images.map(() => ({
      visible: Math.random() > 0.5,
      position: getRandomPosition(),
    }))
  );

  useEffect(() => {
    const intervals = images.map((_, i) =>
      setInterval(() => {
        setCircles((prev) => {
          const updated = [...prev];
          if (updated[i].visible) {
            // Fade out
            updated[i] = { ...updated[i], visible: false };
          } else {
            // After fade out, set new position and fade in
            updated[i] = {
              visible: true,
              position: getRandomPosition(),
            };
          }
          return updated;
        });
      }, Math.random() * 3000 + 2000)
    );

    return () => intervals.forEach(clearInterval);
  }, []);

  return (
    <div className="relative w-full h-screen bg-transparent overflow-hidden flex items-center justify-center">
      <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] rounded-full bg-[#e6e6fa]/40 blur-3xl" />

      {/* Animated Circles */}
      {images.map((img, index) => (
        <img
          key={index}
          src={img}
          alt={`circle-${index}`}
          style={{
            top: circles[index].position.top,
            left: circles[index].position.left,
            opacity: circles[index].visible ? 1 : 0,
            transition: "opacity 1.2s ease-in-out",
          }}
          className="absolute w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
        />
      ))}

      {/* Main Text */}
      <div className="z-10 text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">Voices Together</h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-xl mx-auto">
          "A circle where you’re heard—share, listen, <span className='mx-1'>|</span> or just belong."
        </p>
      </div>
    </div>
  );
};

const getRandomPosition = () => {
  const top = Math.random() * 80 + "%";
  const left = Math.random() * 80 + "%";
  return { top, left };
};

export default HeroSection;
