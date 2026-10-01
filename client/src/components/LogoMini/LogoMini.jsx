import React from "react";
import logolight from "../../assets/logo/logolight.png";

export const LogoMini = ({ className }) => {
    return (
        <div
            className={`w-28 h-[70px] bg-cover bg-[50%_50%] ${className}`}
            style={{ backgroundImage: `url(${logolight})` }}
        />
    );
};