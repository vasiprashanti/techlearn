import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  FiX, FiSidebar, FiGrid, FiBarChart2, FiActivity,
  FiHome, FiBookOpen, FiUsers, FiCode, FiGitCommit,
  FiFileText, FiAward, FiMonitor, FiBell, FiClipboard, FiPieChart, FiSettings
} from "react-icons/fi";

const menuGroups = [
  {
    title: "OVERVIEW",
    items: [
      { id: "admin", title: "Dashboard", icon: <FiGrid className="w-4 h-4" /> },
      { id: "analytics", title: "Analytics", icon: <FiBarChart2 className="w-4 h-4" /> },
      { id: "system-health", title: "System Health", icon: <FiActivity className="w-4 h-4" /> },
    ]
  },
  {
    title: "ORGANIZATION",
    items: [
      { id: "colleges", title: "Colleges", icon: <FiHome className="w-4 h-4" /> },
      { id: "batches", title: "Batches", icon: <FiBookOpen className="w-4 h-4" /> },
      { id: "students", title: "Students", icon: <FiUsers className="w-4 h-4" /> },
    ]
  },
  {
    title: "LEARNING",
    items: [
      { id: "question-bank", title: "Question Bank", icon: <FiCode className="w-4 h-4" /> },
      { id: "track-templates", title: "Track Templates", icon: <FiGitCommit className="w-4 h-4" /> },
      { id: "resources", title: "Resources", icon: <FiFileText className="w-4 h-4" /> },
      { id: "certificates", title: "Certificates", icon: <FiAward className="w-4 h-4" /> },
    ]
  },
  {
    title: "OPERATIONS",
    items: [
      { id: "submission-monitor", title: "Submission Monitor", icon: <FiMonitor className="w-4 h-4" /> },
      { id: "notifications", title: "Notifications", icon: <FiBell className="w-4 h-4" /> },
      { id: "audit-logs", title: "Audit Logs", icon: <FiClipboard className="w-4 h-4" /> },
      { id: "reports", title: "Reports", icon: <FiPieChart className="w-4 h-4" /> },
    ]
  }
];

const settingsItem = {
  id: "settings",
  title: "Settings",
  icon: <FiSettings className="w-4 h-4" />,
};

const SCROLL_KEY = 'sidebar-scroll';

export const OPEN_ADMIN_SIDEBAR_EVENT = 'admin-sidebar:open-mobile';

const Sidebar = ({ showMobileMenuButton = true }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const desktopNavRef = useRef(null);

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
    <div className="space-y-6 pb-12">
      {menuGroups.map((group, idx) => (
        <div key={idx} className="space-y-2">
          <h4 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-black/30 dark:text-white/30 px-4">
            {group.title}
          </h4>
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <NavLink
                key={item.id}
                to={`/${item.id}`}
                onClick={onClickAction}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm tracking-wide transition-all duration-300 ease-out
                  ${
                    isActive
                      ? "bg-white text-[#020b23] dark:bg-[#1a2b6d] dark:text-white font-semibold shadow-lg border border-white/20 dark:border-white/10"
                      : "text-[#020b23]/50 dark:text-white/40 hover:text-[#020b23] hover:bg-white/95 hover:shadow-md hover:border hover:border-[#3C83F6]/20 dark:hover:text-white dark:hover:bg-[#1a2b6d]/95 dark:hover:shadow-lg dark:hover:border dark:hover:border-white/20 font-normal border border-transparent dark:border-transparent"
                  }`
                }
              >
                {item.icon}
                <span>{item.title}</span>
              </NavLink>
            ))}
          </div>
        </div>
      ))}

      <div className="pt-2 border-t border-black/5 dark:border-white/5">
        <NavLink
          to={`/${settingsItem.id}`}
          onClick={onClickAction}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm tracking-wide transition-all duration-300 ease-out
            ${
              isActive
                ? "bg-white text-[#020b23] dark:bg-[#1a2b6d] dark:text-white font-semibold shadow-lg border border-white/20 dark:border-white/10"
                : "text-[#020b23]/50 dark:text-white/40 hover:text-[#020b23] hover:bg-white/95 hover:shadow-md hover:border hover:border-[#3C83F6]/20 dark:hover:text-white dark:hover:bg-[#1a2b6d]/95 dark:hover:shadow-lg dark:hover:border dark:hover:border-white/20 font-normal border border-transparent dark:border-transparent"
            }`
          }
        >
          {settingsItem.icon}
          <span>{settingsItem.title}</span>
        </NavLink>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden lg:flex flex-col fixed left-0 top-0 bg-white/20 dark:bg-black/20 backdrop-blur-xl z-40 h-screen overflow-hidden w-64 pt-11 border-r border-black/5 dark:border-white/5">
        <div ref={desktopNavRef} onScroll={handleDesktopScroll} className="flex-1 overflow-y-auto px-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3C83F6 transparent' }}>
          <style>{`
            .admin-custom-scrollbar::-webkit-scrollbar {
              width: 1px;
            }
            .admin-custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .admin-custom-scrollbar::-webkit-scrollbar-thumb {
              background: #3C83F6;
              border-radius: 1px;
            }
          `}</style>
          <div className="admin-custom-scrollbar">
            {renderNavLinks()}
          </div>
        </div>
      </div>

      {showMobileMenuButton && (
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden fixed top-7 left-5 z-[45] p-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-all"
          aria-label="Open sidebar"
        >
          <FiSidebar className="w-[22px] h-[22px]" />
        </button>
      )}

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-[#daf0fa] dark:bg-[#020b23] border-r border-black/5 dark:border-white/5 z-50 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-4 pt-4 pb-2 mb-4">
                <span className="text-sm font-semibold text-black/70 dark:text-white/70">Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-all"
                  aria-label="Close sidebar"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-hide">
                {renderNavLinks(() => setMobileMenuOpen(false))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
