import { AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import {
  FiX,
  FiSidebar,
  FiGrid,
  FiMap,
  FiPlayCircle,
  FiAward,
  FiUser,
} from "react-icons/fi";

const userNavItems = [
  { id: "dashboard", title: "Dashboard", icon: <FiGrid className="w-4 h-4" /> },
  { id: "dashboard/roadmap", title: "Roadmaps", icon: <FiMap className="w-4 h-4" /> },
  { id: "dashboard/practice", title: "Practice", icon: <FiPlayCircle className="w-4 h-4" /> },
  { id: "dashboard/leaderboard", title: "Leaderboard", icon: <FiAward className="w-4 h-4" /> },
  { id: "dashboard/profile", title: "Profile", icon: <FiUser className="w-4 h-4" /> },
];

const SCROLL_KEY = 'student-sidebar-scroll';

const Sidebar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const desktopNavRef = useRef(null);
  const location = useLocation();
  const { theme } = useTheme();
  const logoSrc = theme === "dark" ? "/logoo2.png" : "/logoo.png";
  const isDashboardRoute =
    location.pathname === '/dashboard' ||
    location.pathname.startsWith('/dashboard/') ||
    location.pathname === '/dashboard/profile' ||
    location.pathname.startsWith('/dashboard/profile/');

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

  const isItemActive = (item) => {
    const path = `/${item.id}`;
    if (item.id === 'dashboard') return location.pathname === path;
    if (item.id === 'dashboard/practice') return location.pathname.startsWith(path);
    if (item.id === 'dashboard/profile') return location.pathname.startsWith(path);
    return location.pathname === path;
  };

  const renderRailLinks = (onClickAction = () => {}) => (
    <div className="flex min-h-full w-full flex-col items-center gap-2 py-2">
      {userNavItems.map((item) => (
        <NavLink
          key={item.id}
          to={`/${item.id}`}
          end={item.id === 'dashboard'}
          onClick={onClickAction}
          title={item.title}
          className={() =>
            `group shrink-0 w-[60px] h-[54px] flex flex-col items-center justify-center rounded-[14px] transition-all duration-200 ease-out ${
              isItemActive(item)
                ? "bg-[#0000a8] text-white shadow-[0_10px_24px_rgba(0,0,168,0.24)]"
                : "text-slate-500 dark:text-slate-300 hover:bg-[#0000a8]/10 hover:text-[#0000a8] dark:hover:bg-[#0000a8]/35 dark:hover:text-white hover:-translate-y-0.5"
            }`
          }
        >
          <span className="[&>svg]:w-4 [&>svg]:h-4">{item.icon}</span>
          <span className="mt-1 max-w-[54px] truncate text-[10px] font-semibold leading-none">{item.title}</span>
        </NavLink>
      ))}
    </div>
  );

  const renderMobileLinks = (onClickAction = () => {}) => (
    <div className="grid grid-cols-3 gap-2 pb-6">
      {userNavItems.map((item) => (
        <NavLink
          key={item.id}
          to={`/${item.id}`}
          end={item.id === 'dashboard'}
          onClick={onClickAction}
          className={() =>
            `h-[62px] rounded-[14px] flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-all ${
              isItemActive(item)
                ? "bg-[#0000a8] text-white"
                : "text-slate-500 dark:text-slate-300 hover:bg-[#0000a8]/10 hover:text-[#0000a8] dark:hover:text-white"
            }`
          }
        >
          {item.icon}
          <span className="max-w-[76px] truncate">{item.title}</span>
        </NavLink>
      ))}
    </div>
  );

  if (!isDashboardRoute) {
    return null;
  }

  return (
    <>
      <aside className="hidden lg:flex fixed left-0 top-0 z-50 h-screen w-[90px] flex-col items-center border-r border-sky-100/70 dark:border-white/10 bg-gradient-to-b from-[#daf0fa] via-[#bceaff] to-[#daf0fa] dark:from-[#020b23] dark:via-[#020b23] dark:to-[#020b23] backdrop-blur-xl py-4 shadow-[8px_0_24px_rgba(15,23,42,0.04)]">
        <NavLink to="/dashboard" aria-label="TechLearn Solutions" className="mb-5 flex h-[56px] w-[56px] items-center justify-center overflow-hidden rounded-2xl">
          <img src={logoSrc} alt="TechLearn Solutions" className="h-full w-full object-contain" />
        </NavLink>
        <div
          ref={desktopNavRef}
          onScroll={handleDesktopScroll}
          className="flex-1 w-full overflow-y-auto overflow-x-hidden px-[15px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {renderRailLinks()}
        </div>
      </aside>

      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed top-24 left-5 z-[45] p-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-all"
        aria-label="Open menu"
      >
        <FiSidebar className="w-[22px] h-[22px]" />
      </button>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <div
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <div
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[21rem] max-w-[88vw] bg-gradient-to-b from-[#daf0fa] via-[#bceaff] to-[#daf0fa] dark:from-[#020b23] dark:via-[#020b23] dark:to-[#020b23] border-r border-sky-100/70 dark:border-white/10 z-50 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-4 pt-4 pb-2 mb-4">
                <img src={logoSrc} alt="TechLearn Solutions" className="h-12 w-12 object-contain" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-all"
                  aria-label="Close menu"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-hide">
                {renderMobileLinks(() => setMobileMenuOpen(false))}
              </div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
