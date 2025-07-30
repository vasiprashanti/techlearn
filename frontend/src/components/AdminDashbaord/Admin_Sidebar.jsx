import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  HiOutlineHome,
  HiOutlineBookOpen,
  HiOutlineChartBar,
} from "react-icons/hi2";
import { HiOutlineUpload } from "react-icons/hi";
import { FiMenu, FiX } from "react-icons/fi";

const menu = [
  { name: "Dashboard", icon: HiOutlineHome, path: "/admin" },
  { name: "Courses", icon: HiOutlineBookOpen, path: "/admin/courses" },
  { name: "Projects", icon: HiOutlineChartBar, path: "/admin/projects" },
  { name: "Upload Files", icon: HiOutlineUpload, path: "/admin/upload-topics" },
];

export default function Admin_Sidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => { document.body.style.overflow = mobileOpen ? "hidden" : ""; }, [mobileOpen]);

  function isActive(path) { return location.pathname === path; }

  return (
    <>
      {/* Hamburger menu for mobile/tablet only */}
      <button
        onClick={() => setMobileOpen(true)}
        style={{ top: '64px' }}
        className="lg:hidden fixed left-6 z-40 p-3 mt-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700 shadow-lg"
        aria-label="Open sidebar menu"
      >
        <FiMenu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      </button>

      {/* MOBILE/TABLET SIDEBAR (slide/drawer style) */}
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
            className="
              fixed top-0 left-0 bottom-0 z-50 flex flex-col bg-white dark:bg-gray-900
              w-72 h-full px-4 py-6 transition-transform duration-300 ease-in-out
              shadow-lg
              flex lg:hidden
            "
            style={{ userSelect: "none" }}
            aria-label="Sidebar navigation"
          >
            <div className="flex items-center pl-16 pt-8 pb-8">
              <Link to="/" onClick={() => setMobileOpen(false)}>
                <img src="/logoo.png" alt="Logo" className="h-16 w-auto block dark:hidden" />
                <img src="/logoo2.png" alt="Logo Dark" className="h-16 w-auto hidden dark:block" />
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
                const active = isActive(path) || (i === 0 && location.pathname === "/admin");
                return (
                  <Link
                    to={path}
                    key={path}
                    className={`
                      group flex items-center gap-3 py-3 px-5 my-1
                      rounded-xl font-semibold text-base relative
                      transition
                      ${
                        active
                          ? "bg-green-100 text-green-700 shadow-[0_4px_32px_0_rgba(44,197,94,0.08)]"
                          : "text-light-text/90 dark:text-dark-text/70 hover:bg-blue-100 hover:text-blue-700"
                      }
                    `}
                    style={{ fontFamily: "Inter, sans-serif" }}
                    onClick={() => setMobileOpen(false)}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-9 w-2 rounded-xl bg-green-500" />
                    )}
                    <span
                      className={`
                        z-10 flex items-center justify-center
                        text-2xl
                        ${active ? "text-white bg-green-500 rounded-lg p-1 shadow" : ""}
                        transition
                      `}
                      style={{ minWidth: 30 }}
                    >
                      <Icon />
                    </span>
                    <span className="z-10 select-none">{name}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* DESKTOP SIDEBAR - always visible, unchanged for desktop */}
      <aside
        className="
          hidden lg:flex flex-col
          w-72
          h-[calc(100vh-48px)]
          mt-6 ml-6
          bg-transparent
          backdrop-blur-lg
          px-4 py-6
          relative
          transition
          select-none
          justify-center
        "
        style={{
          minWidth: "260px",
          maxWidth: "285px",
        }}
        aria-label="Sidebar navigation"
      >
        {/* <div className="flex flex-col items-center justify-center mb-32 mt-3">
          <img
            src="/logoo.png"
            alt="TechLearn Solutions Logo"
            className="block dark:hidden w-20 object-contain"
          />
          <img
            src="/logoo2.png"
            alt="TechLearn Solutions Dark Logo"
            className="hidden dark:block w-20 object-contain"
          />
        </div> */}
        <nav className="flex-none flex flex-col gap-2">
          {menu.map(({ name, icon: Icon, path }, i) => {
            const active = isActive(path) || (i === 0 && location.pathname === "/admin");
            return (
              <Link
                to={path}
                key={path}
                className={`
                  group flex items-center gap-3 py-3 px-5 my-1
                  rounded-xl font-semibold text-base relative
                  transition
                  ${
                    active
                      ? "bg-green-100 text-green-700 shadow-[0_4px_32px_0_rgba(44,197,94,0.08)]"
                      : "text-light-text/90 dark:text-dark-text/70 hover:bg-blue-100 hover:text-blue-700"
                  }
                `}
                style={{
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-9 w-2 rounded-xl bg-green-500" />
                )}
                <span
                  className={`
                    z-10 flex items-center justify-center
                    text-2xl
                    ${active ? "text-white bg-green-500 rounded-lg p-1 shadow" : ""}
                    transition
                  `}
                  style={{ minWidth: 30 }}
                >
                  <Icon />
                </span>
                <span className="z-10 select-none">{name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}