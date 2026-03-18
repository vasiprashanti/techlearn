import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { 
  FiX, FiMenu, FiGrid, FiBarChart2, FiActivity, 
  FiHome, FiBookOpen, FiUsers, FiCode, FiGitCommit, 
  FiFileText, FiAward, FiMonitor, FiBell, FiClipboard, FiPieChart 
} from "react-icons/fi";

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

const Sidebar = ({ isCollapsed, onToggle }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const renderNavLinks = (onClickAction = () => {}) => (
    <div className="space-y-8 pb-12">
      {menuGroups.map((group, idx) => (
        <div key={idx} className="space-y-3">
          <h4 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-black/30 dark:text-white/30 px-4">
            {group.title}
          </h4>
          <div className="space-y-1">
            {group.items.map((item) => (
              <NavLink
                key={item.id}
                to={`/${item.id}`}
                onClick={onClickAction}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm tracking-wide transition-all duration-300 ease-out
                  ${
                    isActive
                      ? "bg-[#3C83F6] text-white dark:bg-white dark:text-black font-semibold shadow-md"
                      : "text-black/50 dark:text-white/50 hover:text-black hover:bg-black/5 dark:hover:text-white dark:hover:bg-white/5 font-normal"
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
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col fixed left-0 top-0 bg-white/20 dark:bg-black/20 backdrop-blur-xl z-40 h-screen overflow-hidden w-64 pt-11 border-r border-black/5 dark:border-white/5">
        <div
          ref={desktopNavRef}
          onScroll={handleDesktopScroll}
          className="flex-1 overflow-y-auto px-4 scrollbar-hide"
        >
          {renderNavLinks()}
        </div>
      </div>

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
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-[#daf0fa] dark:bg-[#020b23] border-r border-black/5 dark:border-white/5 z-50 pt-11 shadow-2xl"
            >
              <div className="flex-1 overflow-y-auto px-4 h-full scrollbar-hide">
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
