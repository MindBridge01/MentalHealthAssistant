import React from "react";
import ellipse6 from "./ellipse-6.png";

export const Box = () => {
  return (
    <div className="w-[151px] h-[151px]">
      <img
        className="fixed w-[151px] h-[151px] top-0 left-0 object-cover"
        alt="Ellipse"
        src={ellipse6}
      />
    </div>
  );
};