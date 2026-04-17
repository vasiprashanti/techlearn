import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from './Sidebar';

export default function UserSidebarLayout({ children, maxWidthClass = 'max-w-7xl' }) {
  const { theme } = useTheme();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isDarkMode = theme === 'dark';
  const isDashboardRoute = location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/');
  const isDashboardDetailRoute =
    /^\/dashboard\/practice\/dsa\/[^/]+$/.test(location.pathname) ||
    /^\/dashboard\/practice\/sql\/[^/]+$/.test(location.pathname) ||
    /^\/dashboard\/practice\/core-cs\/[^/]+$/.test(location.pathname) ||
    /^\/dashboard\/practice\/aptitude\/[^/]+$/.test(location.pathname) ||
    /^\/dashboard\/practice\/company-based\/[^/]+$/.test(location.pathname) ||
    /^\/dashboard\/practice\/company-based\/mock\/[^/]+\/[^/]+$/.test(location.pathname) ||
    /^\/dashboard\/daily-challenge\/[^/]+$/.test(location.pathname);
  const showSidebar = isDashboardRoute && !isDashboardDetailRoute;

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
      <div
        className={`fixed inset-0 -z-10 transition-colors duration-1000 ${
          isDarkMode
            ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]'
            : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'
        }`}
      />

      {showSidebar ? <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} /> : null}

      <main
        className={`flex-1 transition-all duration-700 ease-in-out z-10 ${
          showSidebar ? (sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64') : ''
        } pt-24 pb-12 px-6 md:px-12 lg:px-16 overflow-auto`}
      >
        <div className={`mx-auto ${maxWidthClass}`}>{children}</div>
      </main>
    </div>
  );
}
