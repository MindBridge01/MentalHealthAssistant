import React from "react";
import Mood1 from "../../assets/images/Moods/Mood1.png";
import Mood2 from "../../assets/images/Moods/Mood2.png";
import Mood3 from "../../assets/images/Moods/Mood3.png";
import Mood4 from "../../assets/images/Moods/Mood4.png";
import Mood5 from "../../assets/images/Moods/Mood5.png";

const moods = [
  { label: "Very Happy", image: Mood1 },
  { label: "Happy", image: Mood2 },
  { label: "Neutral", image: Mood3 },
  { label: "Sad", image: Mood4 },
  { label: "Very Sad", image: Mood5 },
];

const MoodCard = ({ onSelectMood, onClose }) => {
  return (
    <div className="inline-flex w-auto h-auto flex-col items-start justify-center gap-10 px-10 py-8 relative bg-white border-solid border-2 border-blue-100 rounded-[24px]">
      <div className="flex items-start justify-between self-stretch w-full relative flex-[0_0_auto]">
        <p className="text-blue-900 text-[20px] font-bold font-[Satoshi]">
          How are you feeling today?
        </p>
        <span
          className="material-icons cursor-pointer text-blue-800"
          onClick={onClose}
        >
          close
        </span>
      </div>
      <div className="inline-flex items-center gap-8 relative flex-[0_0_auto]">
        {moods.map((mood) => (
          <div
            key={mood.label}
            className="flex flex-col items-center justify-center gap-4 cursor-pointer"
            onClick={() => onSelectMood(mood.label)}
          >
            <img src={mood.image} alt={mood.label} style={{ width: "63px", height: "63px" }} />
            <p className="font-[Satoshi] text-[16px] text-blue-800">{mood.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoodCard;
