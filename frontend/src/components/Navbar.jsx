import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuthModalContext } from '../context/AuthModalContext';
import { useAuth } from '../context/AuthContext';
import XPBadge from './XPBadge';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { openLogin } = useAuthModalContext();
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const isDashboardPage = location.pathname === '/dashboard';

  const hideLogoRoutes = [
    "/admin/courses",
    "/admin/upload-exercises",
    "/admin/quizzes-upload",
  ];
  const hideLogo = hideLogoRoutes.includes(location.pathname);

  // Handle scroll to hide/show navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const isDarkMode = theme === 'dark';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <nav className="flex justify-between items-center px-4 md:px-15 py-2.5 md:py-8 bg-transparent relative z-[1000]">
        
        {/* Logo and XP Badge */}
        <div className="logo flex items-center gap-3">
          {!hideLogo && (
            <>
              <Link to="/" className="logo flex items-center">
                <div className="relative" style={{ height: '48px', minWidth: '120px' }}>
                  <img
                    src="/logoo.png"
                    alt="Light Logo"
                    className={`absolute top-0 left-0 h-12 md:h-19 w-auto transition-all duration-300 ${
                      isDarkMode ? 'opacity-0' : 'opacity-100'
                    }`}
                  />
                  <img
                    src="/logoo2.png"
                    alt="Dark Logo"
                    className={`absolute top-0 left-0 h-12 md:h-19 w-auto transition-all duration-300 ${
                      isDarkMode ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </div>
              </Link>

              {/* XP Badge beside logo - Desktop */}
              {!isDashboardPage && (
                <div className="hidden md:block ml-4">
                  <XPBadge />
                </div>
              )}
            </>
          )}
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center" style={{ gap: '62px' }}>
          <Link
            to="/learn"
            className={`relative text-[15px] font-extralight transition-all duration-300 ease-in-out 
              hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-[-2px] 
              after:h-px after:bg-current after:transition-all after:duration-300 after:ease-in-out 
              ${location.pathname.startsWith('/learn') ? 'after:w-full' : 'after:w-0'} 
              ${isDarkMode ? 'text-[#e0e6f5] hover:text-white' : 'text-[#00184f]'}`}
          >
            Learn
          </Link>
          <Link
            to="/build"
            className={`relative text-[15px] font-extralight transition-all duration-300 ease-in-out 
              hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-[-2px] 
              after:h-px after:bg-current after:transition-all after:duration-300 after:ease-in-out 
              ${location.pathname.startsWith('/build') ? 'after:w-full' : 'after:w-0'} 
              ${isDarkMode ? 'text-[#e0e6f5] hover:text-white' : 'text-[#00184f]'}`}
          >
            Build
          </Link>
          <Link
            to="/dashboard"
            className={`relative text-[15px] font-extralight transition-all duration-300 ease-in-out 
              hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-[-2px] 
              after:h-px after:bg-current after:transition-all after:duration-300 after:ease-in-out 
              ${location.pathname.startsWith('/dashboard') ? 'after:w-full' : 'after:w-0'} 
              ${isDarkMode ? 'text-[#e0e6f5] hover:text-white' : 'text-[#00184f]'}`}
          >
            Dashboard
          </Link>

          {isAuthenticated ? (
            <div className="relative group">
              {/* User Greeting with Hover Indicator */}
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-t-lg cursor-pointer transition-all duration-300 
                  ${
                    isDarkMode
                      ? 'text-[#e0e6f5] group-hover:text-white group-hover:bg-white/5'
                      : 'text-[#00184f] group-hover:text-[#001a5c] group-hover:bg-black/5'
                  }`}
              >
                <span className="text-[15px] font-extralight">
                  Hi, {user?.firstName || user?.email || 'User'}
                </span>
              </div>

              {/* Compact Dropdown Menu */}
              <div
                className={`absolute top-full right-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                  transition-all duration-300 transform translate-y-[-10px] group-hover:translate-y-0 z-50`}
              >
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-b-lg cursor-pointer transition-all duration-300 
                    whitespace-nowrap w-24 
                    ${
                      isDarkMode
                        ? 'text-[#e0e6f5] hover:text-white hover:bg-white/5'
                        : 'text-[#00184f] hover:text-[#001a5c] hover:bg-black/5'
                    }`}
                  onClick={logout}
                >
                  <span className="text-[15px] font-extralight">Log Out</span>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={openLogin}
              className={`relative text-[15px] font-extralight transition-all duration-300 ease-in-out
                hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-[-2px] 
                after:w-0 after:h-px after:bg-current after:transition-all after:duration-300 after:ease-in-out
                ${isDarkMode ? 'text-[#e0e6f5] hover:text-white' : 'text-[#00184f]'}`}
            >
              Log In
            </button>
          )}

          {/* Dark Mode Toggle - Desktop */}
          <button
            onClick={toggleTheme}
            className={`text-[15px] transition-colors duration-300 p-1.5 
              ${isDarkMode ? 'text-[#e0e6f5] hover:text-white' : 'text-[#00184f]'}`}
            aria-label="Toggle dark mode"
          >
            <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
        </nav>

        {/* Mobile Menu Toggle */}
        <div
          className={`md:hidden flex justify-center items-center cursor-pointer transition-all duration-300 ${
            isMenuOpen ? 'flex-col gap-[5px]' : 'gap-[5px]'
          }`}
          onClick={toggleMenu}
        >
          <span
            className={`w-[6px] h-[6px] rounded-full transition-all duration-300 ${
              isDarkMode ? 'bg-[#e0e6f5]' : 'bg-black'
            }`}
          ></span>
          <span
            className={`w-[6px] h-[6px] rounded-full transition-all duration-300 ${
              isDarkMode ? 'bg-[#e0e6f5]' : 'bg-black'
            }`}
          ></span>
          <span
            className={`w-[6px] h-[6px] rounded-full transition-all duration-300 ${
              isDarkMode ? 'bg-[#e0e6f5]' : 'bg-black'
            }`}
          ></span>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      <nav
        className={`md:hidden ${isMenuOpen ? 'flex' : 'hidden'} flex-col gap-2 px-5 py-2 z-[999] 
          transition-all duration-300 backdrop-blur-md border-b border-white/20 dark:border-gray-700/20 
          w-full absolute top-full left-0 
          ${
            isDarkMode
              ? 'bg-gradient-to-r from-[#0a1128]/90 via-[#001233]/90 to-[#0a1128]/90'
              : 'bg-gradient-to-r from-[#daf0fa]/90 via-[#bceaff]/90 to-[#bceaff]/90'
          }`}
      >
        <div className="flex flex-col w-full">
          <Link
            to="/learn"
            onClick={closeMenu}
            className={`relative block py-2.5 text-[14px] transition-all duration-300 ease-in-out 
              hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-px 
              after:bg-current after:transition-all after:duration-300 after:ease-in-out 
              ${location.pathname.startsWith('/learn') ? 'after:w-full' : 'after:w-0'} 
              ${isDarkMode ? 'text-[#e0e6f5] hover:text-white' : 'text-black hover:text-[#333]'}`}
          >
            Learn
          </Link>
          <Link
            to="/build"
            onClick={closeMenu}
            className={`relative block py-2.5 text-[14px] transition-all duration-300 ease-in-out 
              hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-px 
              after:bg-current after:transition-all after:duration-300 after:ease-in-out 
              ${location.pathname.startsWith('/build') ? 'after:w-full' : 'after:w-0'} 
              ${isDarkMode ? 'text-[#e0e6f5] hover:text-white' : 'text-black hover:text-[#333]'}`}
          >
            Build
          </Link>
          <Link
            to="/dashboard"
            onClick={closeMenu}
            className={`relative block py-2.5 text-[14px] transition-all duration-300 ease-in-out 
              hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-px 
              after:bg-current after:transition-all after:duration-300 after:ease-in-out 
              ${location.pathname.startsWith('/dashboard') ? 'after:w-full' : 'after:w-0'} 
              ${isDarkMode ? 'text-[#e0e6f5] hover:text-white' : 'text-black hover:text-[#333]'}`}
          >
            Dashboard
          </Link>
        </div>

        <div className="flex flex-col w-full">
          {isAuthenticated ? (
            <div className="py-2.5">
              <div
                className={`text-[14px] mb-2 ${
                  isDarkMode ? 'text-[#e0e6f5]' : 'text-black'
                }`}
              >
                Hi, {user?.firstName || user?.email || 'User'}
              </div>
              <button
                onClick={() => {
                  closeMenu();
                  logout();
                }}
                className={`relative block py-2.5 text-[14px] transition-colors duration-300 
                  hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-0 
                  after:w-0 after:h-px after:bg-current after:transition-all after:duration-300 
                  ${isDarkMode ? 'text-[#e0e6f5] hover:text-white' : 'text-black hover:text-[#333]'}`}
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="py-2.5 w-full flex justify-start">
              <button
                onClick={() => {
                  closeMenu();
                  openLogin();
                }}
                className={`relative block py-2.5 text-[14px] transition-all duration-300 ease-in-out 
                  hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-0 
                  after:w-0 after:h-px after:bg-current after:transition-all after:duration-300 after:ease-in-out 
                  ${isDarkMode ? 'text-[#e0e6f5] hover:text-white' : 'text-black hover:text-[#333]'}`}
              >
                Log In
              </button>
            </div>
          )}
        </div>

        {/* XP Badge - Mobile */}
        {!isDashboardPage && (
          <div className="py-2 w-full flex justify-start pl-4">
            <XPBadge />
          </div>
        )}

        {/* Dark Mode Toggle - Mobile */}
        <div className="w-full flex justify-start">
          <button
            onClick={toggleTheme}
            className={`text-[15px] transition-colors duration-300 p-1.5 
              ${isDarkMode ? 'text-[#e0e6f5] hover:text-white' : 'text-[#00184f]'}`}
            aria-label="Toggle dark mode"
          >
            <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
