import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  FiX,
  FiMenu,
  FiGrid,
  FiTarget,
  FiMap,
  FiPlayCircle,
  FiCpu,
  FiBarChart2,
  FiAward,
  FiBook,
  FiLayers,
  FiFileText,
  FiUser,
  FiSettings,
  FiDatabase,
  FiCode,
  FiBriefcase,
  FiCheckCircle
} from "react-icons/fi";

const menuGroups = [
  {
    title: "MAIN",
    items: [
      { id: "dashboard", title: "Dashboard", icon: <FiGrid className="w-4 h-4" /> },
      { id: "dashboard/daily-challenge", title: "Daily Challenge", icon: <FiTarget className="w-4 h-4" /> },
      { id: "dashboard/roadmap", title: "Roadmap", icon: <FiMap className="w-4 h-4" /> },
      { id: "dashboard/practice", title: "Practice", icon: <FiPlayCircle className="w-4 h-4" /> },
    ]
  },
  {
    title: "PRACTICE",
    items: [
      { id: "dashboard/practice/core-cs", title: "Core CS", icon: <FiCpu className="w-4 h-4" /> },
      { id: "dashboard/practice/aptitude", title: "Aptitude", icon: <FiCheckCircle className="w-4 h-4" /> },
      { id: "dashboard/practice/sql", title: "SQL Practice", icon: <FiDatabase className="w-4 h-4" /> },
      { id: "dashboard/practice/dsa", title: "DSA Practice", icon: <FiCode className="w-4 h-4" /> },
      { id: "dashboard/practice/company-based", title: "Company-Based Questions", icon: <FiBriefcase className="w-4 h-4" /> },
    ]
  },
  {
    title: "PERFORMANCE",
    items: [
      { id: "dashboard/performance", title: "Performance", icon: <FiBarChart2 className="w-4 h-4" /> },
      { id: "dashboard/leaderboard", title: "Leaderboard", icon: <FiAward className="w-4 h-4" /> },
    ]
  },
  {
    title: "RESOURCES",
    items: [
      { id: "dashboard/resources/free-courses", title: "Free Courses", icon: <FiBook className="w-4 h-4" /> },
      { id: "dashboard/resources/important-concepts", title: "Important Concepts", icon: <FiLayers className="w-4 h-4" /> },
      { id: "dashboard/resources/free-certifications", title: "Free Certifications", icon: <FiAward className="w-4 h-4" /> },
      { id: "dashboard/resources/resume-templates", title: "Resume Templates", icon: <FiFileText className="w-4 h-4" /> },
    ]
  },
  {
    title: "ACCOUNT",
    items: [
      { id: "dashboard/account", title: "Profile & Analytics", icon: <FiUser className="w-4 h-4" /> },
      { id: "dashboard/settings", title: "Settings", icon: <FiSettings className="w-4 h-4" /> },
    ]
  }
];

const SCROLL_KEY = 'student-sidebar-scroll';

const Sidebar = ({ isCollapsed, onToggle }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const desktopNavRef = useRef(null);
  const location = useLocation();
  const isDashboardRoute = location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/');

  useEffect(() => {
    if (desktopNavRef.current) {
      const saved = localStorage.getItem(SCROLL_KEY);
      if (saved) desktopNavRef.current.scrollTop = parseInt(saved, 10);
    }
  }, []);

  useEffect(() => {
    if (!isDashboardRoute) {
      document.body.classList.add('dashboard-sidebar-disabled');
    } else {
      document.body.classList.remove('dashboard-sidebar-disabled');
    }

    return () => {
      document.body.classList.remove('dashboard-sidebar-disabled');
    };
  }, [isDashboardRoute]);

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
                end
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

  if (!isDashboardRoute) {
    return null;
  }

  return (
    <>
      <div className="hidden lg:flex flex-col fixed left-0 top-0 bg-white/20 dark:bg-black/20 backdrop-blur-xl z-40 h-screen overflow-hidden w-64 pt-[6.5rem] border-r border-black/5 dark:border-white/5">
        <div ref={desktopNavRef} onScroll={handleDesktopScroll} className="flex-1 overflow-y-auto px-4 scrollbar-hide">
          {renderNavLinks()}
        </div>
      </div>

      <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden fixed top-20 left-6 z-50 p-2 text-black dark:text-white bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-md border border-black/10 dark:border-white/10">
        <FiMenu className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {mobileMenuOpen && (
          <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden fixed top-20 right-6 z-[60] p-2 text-black dark:text-white bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-md border border-black/10 dark:border-white/10">
            <FiX className="w-5 h-5" />
          </button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileMenuOpen(false)} className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 30, stiffness: 200 }} className="lg:hidden fixed left-0 top-0 h-screen w-72 bg-[#daf0fa] dark:bg-[#020b23] border-r border-black/5 dark:border-white/5 z-50 pt-[6.5rem] shadow-2xl">
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