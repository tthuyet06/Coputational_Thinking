import React, { useState } from "react";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full bg-blue-700 shadow-md px-6 sm:px-12 py-3 flex justify-between items-center z-10">
      <h1 className="text-xl font-bold text-white">MOODITRIP</h1>

      <button
        onClick={() => setOpen(!open)}
        className="text-2xl font-bold text-white focus:outline-none"
      >
        ☰
      </button>

      {open && (
        <div className="absolute right-6 top-14 bg-blue-50 shadow-lg rounded-lg w-40 text-gray-800 border border-blue-200">
          <ul className="flex flex-col">
            <li className="px-4 py-2 hover:bg-blue-100 cursor-pointer">
              Hồ sơ
            </li>
            <li className="px-4 py-2 hover:bg-blue-100 cursor-pointer">
              Đăng xuất
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
