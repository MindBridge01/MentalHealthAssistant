import React, { useState, useEffect } from "react";
import gradVideo from "../../assets/videos/gradvideo.mp4";

const BreathingCircle = () => {
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const targetProgress = 100;
  const radius = 90;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const handlePlay = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      setProgress(0);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      const duration = 80000;
      const increment = targetProgress / (duration / 50);
      let currentProgress = 0;

      const interval = setInterval(() => {
        currentProgress += increment;
        if (currentProgress >= targetProgress) {
          currentProgress = targetProgress;
          setIsPlaying(false);
          clearInterval(interval);
        }
        setProgress(currentProgress);
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isPlaying, targetProgress]);

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="relative flex items-center justify-center w-[220px] h-[220px]">
        <svg width="220" height="220" viewBox="0 0 220 220">
          <circle
            cx="110"
            cy="110"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <defs>
            <mask id="progressMask">
              <circle
                cx="110"
                cy="110"
                r={radius}
                stroke="white"
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 110 110)"
              />
            </mask>
            <filter id="glow">
              <feGaussianBlur stdDeviation="60" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <foreignObject width="220" height="220" mask="url(#progressMask)" style={{ filter: "url(#glow)" }}>
            <video
              autoPlay
              loop
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            >
              <source src={gradVideo} type="video/mp4" />
            </video>
          </foreignObject>

          <foreignObject width="220" height="220" mask="url(#progressMask)">
            <video
              autoPlay
              loop
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            >
              <source src={gradVideo} type="video/mp4" />
            </video>
          </foreignObject>
        </svg>

        <button
          onClick={handlePlay}
          className="absolute w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-transparent"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M5 3l14 9-14 9V3z" fill="#2d3048" />
          </svg>
        </button>
      </div>

      <div className="font-satoshi font-bold text-dark-blue900 text-xl sm:text-3xl">
        {Math.round(progress)}%
      </div>
    </div>
  );
};

export default BreathingCircle;
