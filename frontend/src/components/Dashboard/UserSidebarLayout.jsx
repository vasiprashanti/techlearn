import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const shouldHideSidebar = (pathname) => {
  if (!pathname) return false;

  // Focused interfaces (no sidebar)
  if (pathname.startsWith('/mcq/')) return true;
  if (pathname.startsWith('/coding/')) return true;

  // Reading / assessment detail pages
  if (pathname.startsWith('/learn/interview-questions/sql/')) return true;
  if (pathname.startsWith('/learn/interview-questions/dsa/')) return true;

  // Core CS practice behaves like a quiz page in this app
  if (pathname === '/learn/interview-questions/core-cs') return true;
  if (pathname === '/dashboard/practice/core-cs') return true;

  return false;
};

export default function UserSidebarLayout({
  children,
  maxWidthClass = 'max-w-7xl',
  contentClassName = '',
  mainClassName = '',
  forceHideSidebar = false,
}) {
  const location = useLocation();
  const hideSidebar = forceHideSidebar || shouldHideSidebar(location.pathname);

  return (
    <div className="flex min-h-screen w-full">
      {!hideSidebar ? <Sidebar /> : null}

      <main
        className={`min-w-0 flex-1 px-4 pb-10 pt-24 sm:px-6 lg:px-8 ${mainClassName}`}
      >
        <div className={`mx-auto w-full ${maxWidthClass} ${contentClassName}`.trim()}>
          {children}
        </div>
      </main>
    </div>
  );
}
