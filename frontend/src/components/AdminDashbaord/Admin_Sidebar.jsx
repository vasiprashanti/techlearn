import React from "react";
import { HiOutlineHome, HiOutlineBookOpen, HiOutlineUsers, HiOutlineChartBar, HiOutlineCog6Tooth } from "react-icons/hi2";

const menu = [
  { name: "Dashboard", icon: HiOutlineHome },
  { name: "Courses", icon: HiOutlineBookOpen },
  { name: "Users", icon: HiOutlineUsers },
  { name: "Analytics", icon: HiOutlineChartBar },
  { name: "Settings", icon: HiOutlineCog6Tooth }
];

export default function Sidebar({ active, setActive }) {
  return (
    <aside className="w-60 bg-white h-screen py-8 px-3 border-r shadow-sm flex flex-col">
      <div className="text-xl font-semibold mb-8 pl-2 tracking-tight">TechLearn Solutions</div>
      <nav className="flex-1 flex flex-col gap-2">
        {menu.map(({ name, icon: Icon }) => (
          <button
            key={name}
            className={`flex items-center gap-3 py-2 px-3 rounded-lg text-base font-medium transition 
              ${active === name ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"}`}
            onClick={() => setActive && setActive(name)}
          >
            <Icon className="w-5 h-5" />
            <span>{name}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}