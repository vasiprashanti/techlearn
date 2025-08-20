import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  HiOutlineHome,
  HiOutlineBookOpen,
  HiOutlineChartBar,
} from "react-icons/hi2";
import { FiMenu, FiX } from "react-icons/fi";
import { MdQuiz } from "react-icons/md";
import { useTheme } from "../../context/ThemeContext";

const menu = [
  { name: "Dashboard", icon: HiOutlineHome, path: "/admin" },
  { name: "Courses", icon: HiOutlineBookOpen, path: "/admin/courses" },
  { name: "Exercises", icon: HiOutlineChartBar, path: "/admin/upload-exercises" },
  {name : "MCQs", icon: MdQuiz, path: "/admin/mcqupload" }
];

export default function Admin_Sidebar() {
  const location = useLocation();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved === "true";
  });

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", collapsed);
  }, [collapsed]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  function isActive(path) {
    return location.pathname === path;
  }

  return (
    <>
      {/* Hamburger menu for mobile/tablet */}
      <button
        onClick={() => setMobileOpen(true)}
        style={{ top: "64px" }}
        className="lg:hidden fixed left-6 z-40 p-3 mt-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700 shadow-lg"
        aria-label="Open sidebar menu"
      >
        <FiMenu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      </button>

      {/* MOBILE/TABLET SIDEBAR */}
      {mobileOpen && (
        <div>
          {/* Overlay */}
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            aria-hidden="true"
          ></div>

          {/* Sidebar drawer */}
          <aside
            className="fixed top-0 left-0 bottom-0 z-50 flex flex-col bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]
              w-72 h-full px-4 py-6 transition-transform duration-300 ease-in-out
              shadow-lg flex lg:hidden"
            style={{ userSelect: "none" }}
            aria-label="Sidebar navigation"
          >
            <div className="flex items-center pl-16 pt-8 pb-8">
              <Link to="/" onClick={() => setMobileOpen(false)}>
                <img
                  src="/logoo.png"
                  alt="Logo"
                  className="h-16 w-auto block dark:hidden"
                />
                <img
                  src="/logoo2.png"
                  alt="Dark Logo"
                  className="h-16 w-auto hidden dark:block"
                />
              </Link>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 mt-4 rounded-md bg-white/90 dark:bg-white/10 shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              aria-label="Close sidebar menu"
            >
              <FiX className="w-4 h-4 text-black/50 dark:text-white/50" />
            </button>

            {/* Navigation Links */}
            <nav className="flex-none flex flex-col gap-2">
              {menu.map(({ name, icon: Icon, path }, i) => {
                const active =
                  isActive(path) || (i === 0 && location.pathname === "/admin");
                return (
                  <Link
                    to={path}
                    key={path}
                    className={`
                      group flex items-center gap-3 py-3 px-5 my-1
                      rounded-xl font-medium text-base relative
                      transition
                      ${
                        active
                          ? "bg-transparent text-blue-700"
                          : "text-light-text/90 dark:text-dark-text/70 hover:bg-blue-100 hover:text-blue-700"
                      }
                    `}
                    style={{ fontFamily: "Inter, sans-serif" }}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span
                      className={`
                        z-10 flex items-center justify-center
                        text-2xl
                        ${
                          active
                            ? "text-white bg-blue-500 rounded-lg p-1 shadow"
                            : ""
                        }
                        transition
                      `}
                      style={{ minWidth: 30 }}
                    >
                      <Icon />
                    </span>
                    <span className="z-10 select-none">{name}</span>
                    {active && (
                      <span className="absolute left-6 right-20 bottom-1 h-px bg-blue-400 rounded z-20" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside
        className={`
          hidden lg:flex flex-col
          h-screen
          ml-0
          bg-transparent backdrop-blur-lg
          px-2 py-6 relative
          select-none justify-start
          overflow-hidden
          transition-[width] duration-300 ease-in-out
        `}
        style={{ width: collapsed ? "80px" : "288px" }}
        aria-label="Sidebar navigation"
      >
        <div className="flex items-center justify-center mb-8 relative cursor-pointer mr-4">
          <div onClick={() => setCollapsed(!collapsed)} className="relative flex items-center justify-center" style={{ cursor: 'pointer' }}>
            {/* Light Logo */}
            <img
              src="/logoo.png"
              alt="Light Logo"
              className={`h-12 w-auto transition-opacity duration-300 ${
                isDarkMode ? "opacity-0" : "opacity-100"
              }`}
            />
            {/* Dark Logo */}
            <img
              src="/logoo2.png"
              alt="Dark Logo"
              className={`h-12 w-auto absolute transition-opacity duration-300 ${
                isDarkMode ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-none flex flex-col gap-2">
          {menu.map(({ name, icon: Icon, path }, i) => {
            const active =
              isActive(path) || (i === 0 && location.pathname === "/admin");
            return (
              <Link
                to={path}
                key={path}
                className={`
                  group flex items-center gap-3 py-3 px-3 my-1
                  rounded-xl font-medium text-base relative
                  transition-colors duration-300
                  ${
                    active
                      ? "bg-transparent text-blue-700"
                      : "text-light-text/90 dark:text-dark-text/70 hover:bg-blue-200 dark:hover:bg-blue-800 hover:text-blue-700"
                  }
                `}
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                <span
                  className={`
                    z-10 flex items-center justify-center text-2xl
                    ${
                      active
                        ? "text-white bg-blue-500 rounded-lg p-1 shadow"
                        : ""
                    }
                    transition-colors duration-300
                  `}
                  style={{ minWidth: 30 }}
                >
                  <Icon />
                </span>
                {/* Hide names when collapsed */}
                <span
                  className={`z-10 select-none whitespace-nowrap transition-all duration-300 ease-in-out
                    ${
                      collapsed
                        ? "opacity-0 translate-x-[-10px] pointer-events-none"
                        : "opacity-100 translate-x-0"
                    }
                  `}
                >
                  {name}
                </span>
                {active && !collapsed && (
                  <span className="absolute left-5 right-28 bottom-1 h-px bg-blue-400 rounded z-20" />
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
