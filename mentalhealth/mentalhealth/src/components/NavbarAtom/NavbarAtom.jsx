import React from "react";
import { Link } from "react-router-dom";

export const NavbarAtom = ({ text = "About", to = "/" }) => {
    return (
        <Link to={to} className="inline-flex items-center justify-center gap-2.5 p-2.5">
            <div className="relative w-fit text-xl font-medium font-[Satoshi] text-dark-blue900">
                {text}
            </div>
        </Link>
    );
};