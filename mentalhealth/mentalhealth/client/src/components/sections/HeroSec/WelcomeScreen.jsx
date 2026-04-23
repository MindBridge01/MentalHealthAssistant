import React, { useState, useEffect } from "react";
import "./WelcomeScreen.css";

const WelcomeScreen = ({ onComplete, onFadeStart }) => {
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Determine how long we want the load to take (e.g. 2s = 2000ms)
    // 100 steps means 1 step every 20ms
    const totalDuration = 2000;
    const intervalTime = totalDuration / 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      // Hold 100% for brief moment, then trigger fade out
      const fadeTimeout = setTimeout(() => {
        setFading(true);
        if (onFadeStart) onFadeStart();
      }, 500);

      // Give fade animation time to complete before unmounting via onComplete
      const unmountTimeout = setTimeout(() => {
        onComplete();
      }, 1300); // 500ms + 800ms fade CSS duration

      return () => {
        clearTimeout(fadeTimeout);
        clearTimeout(unmountTimeout);
      };
    }
  }, [progress, onComplete]);

  return (
    <div className={`welcome-screen-overlay ${fading ? "welcome-screen-fade-out" : ""}`}>
      <div className="welcome-frame">
        <div className="welcome-heading-beauty-wrapper">
          <div className="welcome-heading-percentage">{progress} %</div>
          <p className="welcome-div">
            <span className="welcome-text-wrapper">Beauty that&#39;s</span>
            <span className="welcome-span">
              {" "}
              <br />
            </span>
            <span className="welcome-text-wrapper-2">true</span>
            <span className="welcome-text-wrapper-3"> to you</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
