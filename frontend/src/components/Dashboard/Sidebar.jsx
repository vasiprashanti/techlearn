import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Award,
  LayoutDashboard,
  Map,
  PanelLeftOpen,
  PlayCircle,
  User,
  X,
} from "lucide-react";

const menuGroups = [
  {
    title: "MAIN",
    items: [
      { id: "dashboard", title: "Dashboard", icon: <LayoutDashboard className="w-[18px] h-[18px] md:w-5 md:h-5" /> },
      { id: "dashboard/roadmap", title: "Roadmaps", icon: <Map className="w-[18px] h-[18px] md:w-5 md:h-5" /> },
      { id: "dashboard/practice", title: "Practice", icon: <PlayCircle className="w-[18px] h-[18px] md:w-5 md:h-5" /> },
      { id: "dashboard/leaderboard", title: "Leaderboard", icon: <Award className="w-[18px] h-[18px] md:w-5 md:h-5" /> },
      { id: "dashboard/profile", title: "Profile", icon: <User className="w-[18px] h-[18px] md:w-5 md:h-5" /> },
    ]
  }
];

const SCROLL_KEY = 'student-sidebar-scroll';

const Sidebar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const desktopNavRef = useRef(null);
  const location = useLocation();
  const isDashboardRoute =
    location.pathname === '/dashboard' ||
    location.pathname.startsWith('/dashboard/') ||
    location.pathname.startsWith('/resources/roadmaps') ||
    location.pathname === '/dashboard/profile' ||
    location.pathname.startsWith('/dashboard/profile/');
  const isRoadmapRoute =
    location.pathname === '/dashboard/roadmap' ||
    location.pathname.startsWith('/resources/roadmaps');

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
          end
          onClick={onClickAction}
          className={({ isActive }) => {
            const isRoadmapAlias = item.id === 'dashboard/roadmap' && location.pathname.startsWith('/resources/roadmaps');
            const isCurrent = isActive || isRoadmapAlias;

            return `flex flex-col items-center justify-center gap-1.5 w-[3.65rem] h-[3.65rem] md:w-[4.15rem] md:h-[4.15rem] rounded-[1.1rem] transition-all duration-300 ease-out select-none
            ${
              isCurrent
                ? "bg-[#e4f6ff] text-[#00113b] font-semibold shadow-md shadow-blue-600/10 border border-[#7ec9ff]/35 dark:bg-[#0b3ef2] dark:text-white dark:shadow-md dark:shadow-blue-600/20 dark:border-blue-400/20"
                : "text-[#00113b]/70 dark:text-slate-400 hover:text-[#00113b] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 font-normal border border-transparent"
            }`;
          }}
        >
          <div className="shrink-0">{item.icon}</div>
          <span className="text-[8px] md:text-[9.5px] font-medium tracking-wide text-center max-w-[80px] truncate leading-none">
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
      <style>{`
        @media (max-width: 1024px) {
          main header {
            padding-left: 3.5rem !important;
            transition: padding 0.3s ease-in-out;
          }
        }
      `}</style>

      {/* Slim vertical desktop sidebar with vertically centered navigation */}
      <div className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 ${isRoadmapRoute ? 'bg-[#eaf8fd]' : 'bg-[#bceaff]'} dark:bg-[#020b23] border-r border-[#1e2d5a]/10 dark:border-white/5 z-40 h-screen overflow-hidden w-[90px] pt-6 shadow-[10px_0_34px_rgba(0,0,0,0.15)] justify-between items-center pb-6`}>
        {/* Adjusted top padding/spacer to push buttons slightly down */}
        <div className="h-14 shrink-0"></div>

        {/* Vertically Centered links */}
        <div className="flex-1 flex flex-col justify-center items-center w-full">
          <div ref={desktopNavRef} onScroll={handleDesktopScroll} className="w-full overflow-y-auto px-1" style={{ scrollbarWidth: 'none' }}>
            <style>{`
              .custom-scrollbar::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div className="custom-scrollbar">
              {renderNavLinks()}
            </div>
          </div>
        </div>

        {/* Adjusted Bottom Spacer to balance the vertical centering */}
        <div className="h-6 w-full shrink-0"></div>
      </div>

      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed top-20 left-5 z-[45] p-2.5 rounded-full backdrop-blur-xl bg-white/40 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] border border-black/5 dark:border-[#15366f]/45 text-[#00113b] dark:text-[#8fd9ff] hover:text-[#3C83F6] dark:hover:text-white hover:scale-105 active:scale-95 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.24)] transition-all duration-300"
      >
        <PanelLeftOpen className="w-[20px] h-[20px]" />
      </button>

      {mobileMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Close sidebar overlay"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <div className={`lg:hidden fixed left-0 top-0 bottom-0 w-24 ${isRoadmapRoute ? 'bg-[#eaf8fd]' : 'bg-[#bceaff]'} dark:bg-[#020b23] border-r border-white/5 z-50 shadow-2xl flex flex-col pt-6 transition-transform duration-200 ease-out`}>
              <div className="flex items-center justify-end shrink-0 relative px-2 h-8">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="absolute right-2 top-0 p-1 text-[#00113b] dark:text-slate-400 hover:text-white"
                  aria-label="Close sidebar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 flex flex-col justify-center items-center overflow-y-auto px-1 pb-6 scrollbar-hide w-full">
                {renderNavLinks(() => setMobileMenuOpen(false))}
              </div>
          </div>
        </>
      )}
    </>
  );
};

export default Sidebar;
