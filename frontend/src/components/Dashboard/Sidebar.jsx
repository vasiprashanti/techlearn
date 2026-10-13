import { useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Award,
  Briefcase,
  BarChart3,
  BriefcaseBusiness,
  BookOpen,
  LayoutDashboard,
  Map,
  User,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const menuGroups = [
  {
    title: "MAIN",
    items: [
      { id: "dashboard", title: "Dashboard", icon: <LayoutDashboard className="w-[18px] h-[18px] md:w-5 md:h-5" /> },
      { id: "learn", title: "Learn", icon: <BookOpen className="w-[18px] h-[18px] md:w-5 md:h-5" /> },
      { id: "jobs", title: "Hiring", icon: <BriefcaseBusiness className="w-[18px] h-[18px] md:w-5 md:h-5" /> },
      { id: "roadmaps", title: "Roadmaps", icon: <Map className="w-[18px] h-[18px] md:w-5 md:h-5" /> },
      { id: "dashboard/leaderboard", title: "Leaderboard", icon: <Award className="w-[18px] h-[18px] md:w-5 md:h-5" /> },
      { id: "dashboard/performance", title: "Performance", icon: <BarChart3 className="w-[18px] h-[18px] md:w-5 md:h-5" /> },
      { id: "dashboard/profile", title: "Profile", icon: <User className="w-[18px] h-[18px] md:w-5 md:h-5" /> },
    ]
  }
];

const SCROLL_KEY = 'student-sidebar-scroll';

const Sidebar = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const desktopNavRef = useRef(null);
  const location = useLocation();
  const isDashboardRoute =
    location.pathname === '/dashboard' ||
    location.pathname.startsWith('/demo') ||
    location.pathname.startsWith('/dashboard/') ||
    location.pathname.startsWith('/resources/roadmaps') ||
    location.pathname.startsWith('/roadmaps') ||
    location.pathname.startsWith('/learn/program/') ||
    location.pathname.startsWith('/jobs') ||
    location.pathname === '/dashboard/profile' ||
    location.pathname.startsWith('/dashboard/profile/');
  const isProfileRoute = location.pathname.startsWith('/dashboard/profile');
  const sidebarShadowClass = isDarkMode
    ? (isProfileRoute ? 'shadow-[6px_0_18px_rgba(0,0,0,0.08)]' : 'shadow-[10px_0_34px_rgba(0,0,0,0.15)]')
    : 'shadow-none';

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
    <div className="flex flex-col items-center gap-3.5 py-4 w-full">
      {menuGroups[0].items.map((item) => (
        <NavLink
          key={item.id}
          to={`/${item.id}`}
          end={item.id !== "roadmaps"}
          onClick={onClickAction}
          className={({ isActive }) => {
            const isCurrent = item.id === "roadmaps"
              ? ["/roadmaps", "/resources/roadmaps", "/dashboard/roadmap"].some((p) => location.pathname.startsWith(p))
              : isActive;

            return `flex flex-col items-center justify-center gap-1.5 w-[3.65rem] h-[3.65rem] md:w-[4.15rem] md:h-[4.15rem] rounded-[1.1rem] transition-all duration-300 ease-out select-none
            ${
              isCurrent
                ? "bg-[#b2e96a] text-[#0a1128] font-bold shadow-md shadow-[#b2e96a]/25 border border-[#b2e96a]/50 dark:bg-[#b2e96a] dark:text-[#0a1128] dark:font-bold dark:shadow-md dark:shadow-[#b2e96a]/25 dark:border-[#b2e96a]/50"
                : "text-[#00113b]/70 dark:text-slate-400 hover:text-[#00113b] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 font-normal border border-transparent"
            }`;
          }}
        >
          <div className="shrink-0">{item.icon}</div>
          <span className="text-[8px] md:text-[9.5px] font-semibold tracking-wide text-center max-w-[80px] truncate leading-none">
            {item.title}
          </span>
        </NavLink>
      ))}
    </div>
  );

  if (!isDashboardRoute) {
    return null;
  }

  return (
    <>

      {/* Slim vertical sidebar (tablet and desktop); the link group is centred in the full page height */}
      <div className={`hidden md:flex flex-col fixed left-0 top-0 bottom-0 bg-[#ffffff30] dark:bg-[#01071e] border-r-0 z-40 h-screen overflow-hidden w-[90px] ${sidebarShadowClass} justify-center items-center`}>
        <div ref={desktopNavRef} onScroll={handleDesktopScroll} className="w-full max-h-full overflow-y-auto px-1 custom-scrollbar" style={{ scrollbarWidth: 'none' }}>
          {renderNavLinks()}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
