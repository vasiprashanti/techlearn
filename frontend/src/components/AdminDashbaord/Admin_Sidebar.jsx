import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { 
  FiX, FiMenu, FiGrid, FiBarChart2, FiActivity, FiChevronLeft, FiChevronDown,
  FiHome, FiBookOpen, FiUsers, FiCode, FiGitCommit, 
  FiFileText, FiAward, FiMonitor, FiBell, FiClipboard, FiPieChart, FiSettings
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

const menuGroups = [
  {
    title: "OVERVIEW",
    items: [
      { id: "admin",         title: "Dashboard",    icon: <FiGrid className="w-4 h-4" />      },
      { id: "analytics",     title: "Analytics",    icon: <FiBarChart2 className="w-4 h-4" /> },
      { id: "system-health", title: "System Health",icon: <FiActivity className="w-4 h-4" />  },
    ]
  },
  {
    title: "ORGANIZATION",
    items: [
      { id: "colleges", title: "Colleges", icon: <FiHome className="w-4 h-4" />     },
      { id: "batches",  title: "Batches",  icon: <FiBookOpen className="w-4 h-4" /> },
      { id: "students", title: "Students", icon: <FiUsers className="w-4 h-4" />    },
    ]
  },
  {
    title: "LEARNING",
    items: [
      { id: "question-bank",   title: "Question Bank",    icon: <FiCode className="w-4 h-4" />      },
      { id: "track-templates", title: "Track Templates",  icon: <FiGitCommit className="w-4 h-4" /> },
      { id: "resources",       title: "Resources",        icon: <FiFileText className="w-4 h-4" />  },
      { id: "certificates",    title: "Certificates",     icon: <FiAward className="w-4 h-4" />     },
    ]
  },
  {
    title: "OPERATIONS",
    items: [
      { id: "submission-monitor", title: "Submission Monitor", icon: <FiMonitor className="w-4 h-4" />   },
      { id: "notifications",      title: "Notifications",      icon: <FiBell className="w-4 h-4" />      },
      { id: "audit-logs",         title: "Audit Logs",         icon: <FiClipboard className="w-4 h-4" /> },
      { id: "reports",            title: "Reports",            icon: <FiPieChart className="w-4 h-4" />  },
    ]
  }
];

const SCROLL_KEY = 'sidebar-scroll';

const settingsItem = {
  id: "settings",
  title: "Settings",
  icon: <FiSettings className="w-4 h-4" />,
};

const Sidebar = ({ isCollapsed, onToggle }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  // Ref for the desktop scrollable nav
  const desktopNavRef = useRef(null);

  // Restore scroll position when component mounts / route changes
  useEffect(() => {
    if (desktopNavRef.current) {
      const saved = localStorage.getItem(SCROLL_KEY);
      if (saved) desktopNavRef.current.scrollTop = parseInt(saved, 10);
    }
  }, []);

  const handleDesktopScroll = () => {
    if (desktopNavRef.current) {
      localStorage.setItem(SCROLL_KEY, desktopNavRef.current.scrollTop);
    }
  };

  const renderLogo = (compact = false) => (
    <div
      className={`relative shrink-0 rounded-full border border-white/70 dark:border-white/25 shadow-sm flex items-center justify-center
        ${compact ? "w-7 h-7" : "w-10 h-10"}
        bg-[#0a346b] dark:bg-[#d9e8ff]`}
    >
      <span
        className={`font-semibold tracking-tight leading-none select-none
          ${compact ? "text-sm" : "text-lg"}
          text-white dark:text-[#123766]`}
      >
        tls
      </span>
    </div>
  );

  const renderUserPanel = (compact = false) => {
    const initial = user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "A";
    const displayName = user?.firstName || "Admin User";
    const email = user?.email || "admin@trace.io";

    return (
      <div className={`border-t border-white/10 ${compact ? "p-2.5" : "p-3"}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#3C83F6] text-white flex items-center justify-center text-base font-semibold tracking-tight shrink-0">
            {initial}
          </div>
          {!compact && (
            <div className="min-w-0">
              <p className="text-xl font-semibold text-white truncate leading-tight">
                {displayName}
              </p>
              <p className="text-[11px] text-white/55 truncate mt-0.5">
                {email}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderNavLinks = (compact = false, onClickAction = () => {}) => (
    <div className="space-y-8 pb-12">
      {menuGroups.map((group, idx) => (
        <div key={idx} className={compact ? "space-y-2" : "space-y-3"}>
          {!compact && (
            <div className="flex items-center justify-between px-4">
              <h4 className="text-[10px] uppercase tracking-[0.14em] font-semibold text-white/35">
                {group.title}
              </h4>
              <FiChevronDown className="w-3.5 h-3.5 text-white/30" />
            </div>
          )}
          <div className="space-y-1">
            {group.items.map((item) => (
              <NavLink
                key={item.id}
                to={`/${item.id}`}
                onClick={onClickAction}
                className={({ isActive }) =>
                  `flex items-center ${compact ? "justify-center" : "gap-3"} px-4 py-2.5 rounded-2xl text-sm tracking-wide transition-all duration-300 ease-out border
                  ${
                    isActive
                      ? "bg-[#3C83F6] text-white border-white/70 dark:border-white/20 font-semibold shadow-[0_0_0_2px_rgba(255,255,255,0.9)] dark:shadow-[0_0_0_2px_rgba(255,255,255,0.22)]"
                      : "text-white/55 border-transparent hover:text-white hover:bg-white/5 font-medium"
                  }`
                }
                title={compact ? item.title : undefined}
              >
                {item.icon}
                {!compact && <span>{item.title}</span>}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderSettingsSection = (compact = false, onClickAction = () => {}) => (
    <div className="-mx-4 px-4 pt-4 pb-4 border-t border-white/10">
      <NavLink
        to={`/${settingsItem.id}`}
        onClick={onClickAction}
        className={({ isActive }) =>
          `flex items-center ${compact ? "justify-center" : "gap-3"} px-4 py-2.5 rounded-2xl text-sm tracking-wide transition-all duration-300 ease-out border
          ${
            isActive
              ? "bg-[#3C83F6] text-white border-white/70 dark:border-white/20 font-semibold shadow-[0_0_0_2px_rgba(255,255,255,0.9)] dark:shadow-[0_0_0_2px_rgba(255,255,255,0.22)]"
              : "text-white/55 border-transparent hover:text-white hover:bg-white/5 font-medium"
          }`
        }
        title={compact ? settingsItem.title : undefined}
      >
        {settingsItem.icon}
        {!compact && <span>{settingsItem.title}</span>}
      </NavLink>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={`hidden lg:flex flex-col fixed left-0 top-0 z-40 h-screen overflow-hidden pt-0 border-r transition-all duration-300
          ${isCollapsed ? "w-20" : "w-64"}
          bg-gradient-to-b from-[#0a1a44] via-[#0a173c] to-[#091333]
          dark:from-[#08163a] dark:via-[#071231] dark:to-[#060f2a]
          border-white/10`}
      >
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-4 py-2.5 border-b border-white/10`}>
          <div className="flex items-center gap-3 min-w-0">
            {renderLogo(isCollapsed)}
          </div>
          {!isCollapsed && (
            <button
              onClick={() => onToggle?.(true)}
              className="w-8 h-8 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center"
              aria-label="Collapse sidebar"
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>
          )}
        </div>
        <div
          ref={desktopNavRef}
          onScroll={handleDesktopScroll}
          className="flex-1 overflow-y-auto px-4 pt-6 scrollbar-hide"
        >
          {renderNavLinks(isCollapsed)}
          {renderSettingsSection(isCollapsed)}
        </div>
        {renderUserPanel(isCollapsed)}
      </div>

      {isCollapsed && (
        <button
          onClick={() => onToggle?.(false)}
          className="hidden lg:flex fixed left-20 -translate-x-1/2 top-3 z-50 w-7 h-7 rounded-lg items-center justify-center
            bg-white/90 text-[#18386d] border border-white/80 shadow-sm"
          aria-label="Expand sidebar"
        >
          <FiChevronLeft className="w-3.5 h-3.5 rotate-180" />
        </button>
      )}

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed top-6 left-6 z-50 p-2 text-black dark:text-white bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-md border border-black/10 dark:border-white/10"
      >
        <FiMenu className="w-5 h-5" />
      </button>

      {/* Mobile close button */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden fixed top-6 right-6 z-[60] p-2 text-black dark:text-white bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-md border border-black/10 dark:border-white/10"
          >
            <FiX className="w-5 h-5" />
          </button>
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
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
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 z-50 shadow-2xl border-r
                bg-gradient-to-b from-[#0a1a44] via-[#0a173c] to-[#091333]
                dark:from-[#08163a] dark:via-[#071231] dark:to-[#060f2a]
                border-white/10"
            >
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
                  {renderLogo()}
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-8 h-8 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center"
                    aria-label="Close sidebar"
                  >
                    <FiChevronLeft className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pt-6 scrollbar-hide">
                  {renderNavLinks(false, () => setMobileMenuOpen(false))}
                  {renderSettingsSection(false, () => setMobileMenuOpen(false))}
                </div>
                {renderUserPanel(false)}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
