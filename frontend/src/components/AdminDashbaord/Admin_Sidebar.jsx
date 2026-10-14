import { motion as Motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import {
  FiX, FiSidebar, FiGrid, FiBarChart2, FiActivity,
  FiHome, FiBookOpen, FiUsers, FiCode, FiGitCommit,
  FiFileText, FiAward, FiMonitor, FiBell, FiClipboard, FiPieChart, FiSettings, FiTerminal,
  FiLayers, FiFolder, FiBriefcase
} from "react-icons/fi";

const menuGroups = [
  {
    title: "OVERVIEW",
    items: [
      { id: "admin", title: "Dashboard", icon: <FiGrid className="w-4 h-4" /> },
    ]
  },
  {
    title: "LEARNING",
    items: [
      { id: "programs", title: "Programs", icon: <FiFolder className="w-4 h-4" /> },
      { id: "question-bank", title: "Question Bank", icon: <FiCode className="w-4 h-4" /> },
      { id: "track-templates", title: "Track Templates", icon: <FiGitCommit className="w-4 h-4" /> },
      { id: "admin/roadmaps", title: "Roadmaps", icon: <FiFileText className="w-4 h-4" /> },
      { id: "admin/courses", title: "Courses", icon: <FiBookOpen className="w-4 h-4" /> },
      { id: "admin/hiring", title: "Hiring", icon: <FiBriefcase className="w-4 h-4" /> },
      { id: "admin/projects", title: "Projects", icon: <FiClipboard className="w-4 h-4" /> },
      { id: "certificates", title: "Certificates", icon: <FiAward className="w-4 h-4" /> },
    ]
  },
  {
    title: "ORGANIZATION",
    items: [
      { id: "batches", title: "Batches", icon: <FiLayers className="w-4 h-4" /> },
      { id: "students", title: "Students", icon: <FiUsers className="w-4 h-4" /> },
      { id: "colleges", title: "Colleges", icon: <FiHome className="w-4 h-4" /> },
      { id: "admin/hiring", title: "Companies", icon: <FiBriefcase className="w-4 h-4" /> },
    ]
  },
  {
    title: "OPERATIONS",
    items: [
      { id: "submission-monitor", title: "Submission Monitor", icon: <FiMonitor className="w-4 h-4" /> },
      { id: "audit-logs", title: "Audit Logs", icon: <FiClipboard className="w-4 h-4" /> },
      { id: "reports", title: "Reports", icon: <FiPieChart className="w-4 h-4" /> },
    ]
  },
  {
    title: "SYSTEM",
    items: [
      { id: "admin/pricing", title: "Pricing", icon: <FiSettings className="w-4 h-4" /> },
      { id: "settings", title: "Settings", icon: <FiSettings className="w-4 h-4" /> },
      { id: "analytics", title: "Analytics", icon: <FiBarChart2 className="w-4 h-4" /> },
      { id: "system-health", title: "System Health", icon: <FiActivity className="w-4 h-4" /> },
    ]
  }
];

const SCROLL_KEY = 'sidebar-scroll';

export const OPEN_ADMIN_SIDEBAR_EVENT = 'admin-sidebar:open-mobile';

const Sidebar = ({ showMobileMenuButton = true }) => {
  useEffect(() => {
    const openDatePicker = event => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || input.type !== 'date' || input.disabled || input.readOnly) return;
      try { input.showPicker?.(); } catch { /* Keep the native date input usable in unsupported browsers. */ }
    };
    document.addEventListener('click', openDatePicker);
    return () => document.removeEventListener('click', openDatePicker);
  }, []);
  const { theme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const desktopNavRef = useRef(null);
  const isDarkMode = theme === "dark";

  const sectionHeadingClass = isDarkMode
    ? "text-[11px] uppercase tracking-[0.16em] font-semibold text-[#8b9bb4] px-3.5 py-1"
    : "text-[11px] uppercase tracking-[0.16em] font-semibold text-[#17386c]/65 px-3.5 py-1";

  const getNavClass = (isActive) =>
    `sidebar-button flex items-center gap-3 px-3.5 py-2 rounded-lg text-[13.5px] font-medium tracking-normal transition-all duration-200 ease-out ${
      isActive
        ? isDarkMode
          ? "bg-[#0b154a] !text-white font-semibold shadow-sm border border-[#2b3a74]/60"
          : "bg-[#00113b] text-white font-semibold shadow-sm border border-[#00113b]/20"
        : isDarkMode
          ? "!text-[#94a3b8] hover:!text-white hover:bg-[#121c4b]/50 font-normal border border-transparent"
          : "!text-[#00113b] hover:!text-[#2f73e0] hover:bg-white/60 font-normal border border-transparent"
    }`;

  useEffect(() => {
    if (desktopNavRef.current) {
      const saved = localStorage.getItem(SCROLL_KEY);
      if (saved) desktopNavRef.current.scrollTop = parseInt(saved, 10);
    }
  }, []);

  useEffect(() => {
    const handleOpenMobileSidebar = () => setMobileMenuOpen(true);
    window.addEventListener(OPEN_ADMIN_SIDEBAR_EVENT, handleOpenMobileSidebar);
    return () => window.removeEventListener(OPEN_ADMIN_SIDEBAR_EVENT, handleOpenMobileSidebar);
  }, []);

  const handleDesktopScroll = () => {
    if (desktopNavRef.current) {
      localStorage.setItem(SCROLL_KEY, desktopNavRef.current.scrollTop);
    }
  };

  const renderNavLinks = (onClickAction = () => {}) => (
    <div className="space-y-5 pb-8 pt-2">
      {menuGroups.map((group, idx) => (
        <div key={idx} className="space-y-1">
          <h4 className={sectionHeadingClass}>
            {group.title}
          </h4>
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <NavLink
                key={item.id}
                to={`/${item.id}`}
                onClick={onClickAction}
                end={item.id === "admin"}
                className={({ isActive }) => getNavClass(isActive)}
              >
                {item.icon}
                <span>{item.title}</span>
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className={`sidebar-container hidden lg:flex flex-col fixed left-0 top-[72px] bottom-0 z-40 overflow-hidden w-64 ${
        isDarkMode
          ? "bg-[#070e38] border-r border-[#1a234d]"
          : "bg-[#daf0fa]/95 border-r border-black/10"
      }`}>
        <div ref={desktopNavRef} onScroll={handleDesktopScroll} className="flex-1 overflow-y-auto px-3.5 py-2 admin-sidebar-scroll" style={{ scrollbarWidth: 'thin', scrollbarColor: isDarkMode ? '#243266 transparent' : '#3C83F6 transparent' }}>
          <style>{`
            .admin-sidebar-scroll::-webkit-scrollbar {
              width: 3px;
            }
            .admin-sidebar-scroll::-webkit-scrollbar-track {
              background: transparent;
            }
            .admin-sidebar-scroll::-webkit-scrollbar-thumb {
              background: ${isDarkMode ? '#243266' : '#3C83F6'};
              border-radius: 3px;
            }
          `}</style>
          <div>
            {renderNavLinks()}
          </div>
        </div>
      </div>

      {showMobileMenuButton && (
        <button
          onClick={() => setMobileMenuOpen(true)}
          title="Open Menu"
          className="lg:hidden fixed top-20 left-4 z-[45] flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-xl bg-white/55 dark:bg-black/55 border border-black/10 dark:border-white/10 text-[#00113b] dark:text-[#8fd9ff] hover:text-[#3c83f6] dark:hover:text-white hover:scale-105 active:scale-95 shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-300"
        >
          <FiSidebar className="w-4 h-4" />
          <span className="text-xs font-semibold tracking-wide">Menu</span>
        </button>
      )}

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <Motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className={`lg:hidden fixed left-0 top-0 bottom-0 w-72 z-50 shadow-2xl flex flex-col ${
                isDarkMode
                  ? "bg-[#070e38] border-r border-[#1a234d]"
                  : "bg-[#daf0fa] border-r border-black/10"
              }`}
            >
              <div className="flex items-center justify-between px-4 pt-4 pb-2 mb-4">
                <span className={`text-sm font-semibold ${isDarkMode ? "text-white/70" : "text-black/70"}`}>Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className={`p-2 rounded-md transition-all ${
                    isDarkMode
                      ? "text-white/60 hover:text-white hover:bg-white/10"
                      : "text-black/60 hover:text-black hover:bg-black/5"
                  }`}
                  aria-label="Close sidebar"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-hide">
                {renderNavLinks(() => setMobileMenuOpen(false))}
              </div>
            </Motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
