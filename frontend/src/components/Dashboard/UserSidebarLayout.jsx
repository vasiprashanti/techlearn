import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from './Sidebar';

export default function UserSidebarLayout({ children, maxWidthClass = 'max-w-[1400px]' }) {
  const { theme } = useTheme();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isDarkMode = theme === 'dark';
  const isRoadmapRoute =
    location.pathname === '/dashboard/roadmap' ||
    location.pathname.startsWith('/resources/roadmaps');
  const isDashboardRoute =
    location.pathname === '/dashboard' ||
    location.pathname.startsWith('/dashboard/') ||
    location.pathname.startsWith('/resources/roadmaps') ||
    location.pathname === '/dashboard/profile' ||
    location.pathname.startsWith('/dashboard/profile/');
  const isDashboardDetailRoute =
    /^\/dashboard\/practice\/dsa\/[^/]+$/.test(location.pathname) ||
    /^\/dashboard\/practice\/sql\/[^/]+$/.test(location.pathname) ||
    /^\/dashboard\/practice\/core-cs\/[^/]+$/.test(location.pathname) ||
    /^\/dashboard\/practice\/aptitude\/[^/]+$/.test(location.pathname) ||
    /^\/dashboard\/practice\/company-based\/[^/]+$/.test(location.pathname) ||
    /^\/dashboard\/practice\/company-based\/mock\/[^/]+\/[^/]+$/.test(location.pathname) ||
    /^\/dashboard\/resources\/important-concepts\/[^/]+$/.test(location.pathname) ||
    /^\/dashboard\/daily-challenge\/[^/]+$/.test(location.pathname);
  const showSidebar = isDashboardRoute && !isDashboardDetailRoute;

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
      <div
        className={`fixed inset-0 -z-10 transition-colors duration-1000 ${
          isDarkMode
            ? 'bg-[#020816]'
            : isRoadmapRoute
              ? 'bg-[#eaf8fd]'
              : 'bg-gradient-to-br from-[#bceaff] via-[#9adfff] to-[#bceaff]'
        }`}
      />

      {showSidebar ? <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} /> : null}

      <main
        className={`flex flex-col items-center flex-1 transition-all duration-700 ease-in-out z-10 ${
          showSidebar ? 'lg:ml-[90px]' : ''
        } pt-28 pb-12 px-6 md:px-12 lg:px-16 overflow-auto`}
      >
        <div className={`w-full mx-auto ${maxWidthClass}`}>{children}</div>
      </main>
    </div>
  );
}
