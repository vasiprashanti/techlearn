import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuthModalContext } from '../context/AuthModalContext';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { openLogin } = useAuthModalContext();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  
  const shouldHideNavbar = location.pathname === "/coding";

  const hideLogoRoutes = [
    "/admin/courses",
    "/admin/upload-exercises",
    "/admin/quizzes-upload",
    "/admin/mcqupload",
  ];
  // Hide logo for exact matches or any subroutes (e.g., /admin/courses/123)
  const hideLogo = hideLogoRoutes.some((route) => location.pathname === route || location.pathname.startsWith(route + "/"));

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

  useEffect(() => {
    if (!isUserMenuOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsUserMenuOpen(false);
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isUserMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const isDarkMode = theme === 'dark';

  if (shouldHideNavbar) {
    return null;
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <nav className="flex justify-between items-center px-4 md:px-15 py-2.5 md:py-8 bg-transparent relative z-[1000]">
        
        {/* Logo */}
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
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className={`relative text-[15px] font-extralight transition-all duration-300 ease-in-out
                  hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-[-2px]
                  after:w-0 after:h-px after:bg-current after:transition-all after:duration-300 after:ease-in-out
                  ${isUserMenuOpen ? 'after:w-full' : 'after:w-0'}
                  ${isDarkMode ? 'text-[#e0e6f5] hover:text-white' : 'text-[#00184f] hover:text-[#001a5c]'}`}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
              >
                Hi, {user?.firstName || user?.email || 'User'}
              </button>

              {isUserMenuOpen && (
                <div className="absolute top-full right-0 z-50 mt-3 w-72 overflow-hidden rounded-2xl border border-[#86c4ff]/45 bg-gradient-to-br from-[#e7f6ff]/95 to-[#d9efff]/90 shadow-[0_12px_34px_rgba(60,131,246,0.16)] backdrop-blur-xl dark:border-[#6fbfff]/35 dark:from-[#052152]/90 dark:to-[#072b63]/85">
                  <div className="border-b border-[#86c4ff]/45 bg-[#dbf1ff]/70 p-4 dark:border-[#6fbfff]/30 dark:bg-[#0d366f]/60">
                    <h3 className="truncate text-sm font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">
                      {user?.firstName ? `${user.firstName} ${user?.lastName || ''}`.trim() : (user?.email || 'User')}
                    </h3>
                    <p className="mt-0.5 truncate text-xs text-[#4c6f9a] dark:text-[#7fb8e2]">
                      {user?.email || 'student@techlearn.com'}
                    </p>
                    <span className="mt-2 inline-flex items-center rounded-full border border-[#86c4ff]/60 bg-[#edf8ff] px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-[#2d7fe8] dark:border-[#6bb8ec]/50 dark:bg-[#0a2f6f] dark:text-[#8fd9ff]">
                      Student
                    </span>
                  </div>

                  <div className="p-2.5 space-y-1.5">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full rounded-xl border border-[#f6b6b4]/60 bg-[#ffe6e5] px-3 py-2.5 text-left text-sm font-medium text-[#be4b43] transition hover:bg-[#ffd9d7] dark:border-[#8a3a35]/60 dark:bg-[#4a1f22]/50 dark:text-[#ffb6b0] dark:hover:bg-[#5b272b]/60"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
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
        <button
          type="button"
          className={`md:hidden flex justify-center items-center cursor-pointer transition-all duration-300 p-1 ${
            isDarkMode ? 'text-[#e0e6f5]' : 'text-[#00184f]'
          }`}
          onClick={toggleMenu}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        >
          <span className="text-2xl leading-none">{isMenuOpen ? '✕' : '☰'}</span>
        </button>
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
