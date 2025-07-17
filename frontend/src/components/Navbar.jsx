import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuthModalContext } from '../context/AuthModalContext'
import { useAuth } from '../context/AuthContext'
import XPBadge from './XPBadge'

const Navbar = () => {
  const { theme, toggleTheme } = useTheme()
  const { openLogin } = useAuthModalContext()
  const { isAuthenticated, user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Handle scroll to hide/show navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const isDarkMode = theme === 'dark'

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <nav className="flex justify-between items-center px-4 md:px-15 py-2.5 md:py-8 bg-transparent relative z-[1000]">
        {/* Logo and XP Badge */}
        <div className="logo flex items-center gap-3">
          <Link to="/" className="logo flex items-center">
            <div className="relative" style={{ height: '48px', minWidth: '120px' }}>
              <img
                src="/logoo.png"
                alt="Light Logo"
                className={`absolute top-0 left-0 h-12 md:h-19 w-auto transition-all duration-300 ${isDarkMode ? 'opacity-0' : 'opacity-100'}`}
              />
              <img
                src="/logoo2.png"
                alt="Dark Logo"
                className={`absolute top-0 left-0 h-12 md:h-19 w-auto transition-all duration-300 ${isDarkMode ? 'opacity-100' : 'opacity-0'}`}
              />
            </div>
          </Link>
          {/* XP Badge beside logo - Desktop */}
          <div className="hidden md:block">
            <XPBadge />
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center" style={{ gap: '62px' }}>
          <Link
            to="/learn"
            className={`relative text-[15px] font-extralight transition-colors duration-300 hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-[-2px] after:w-0 after:h-px after:bg-current after:transition-all after:duration-300 ${
              isDarkMode
                ? 'text-[#e0e6f5] hover:text-white'
                : 'text-[#00184f]'
            }`}
          >
            Learn
          </Link>
          <Link
            to="/build"
            className={`relative text-[15px] font-extralight transition-colors duration-300 hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-[-2px] after:w-0 after:h-px after:bg-current after:transition-all after:duration-300 ${
              isDarkMode
                ? 'text-[#e0e6f5] hover:text-white'
                : 'text-[#00184f]'
            }`}
          >
            Build
          </Link>
          <Link
            to="/dashboard"
            className={`relative text-[15px] font-extralight transition-colors duration-300 hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-[-2px] after:w-0 after:h-px after:bg-current after:transition-all after:duration-300 ${
              isDarkMode
                ? 'text-[#e0e6f5] hover:text-white'
                : 'text-[#00184f]'
            }`}
          >
            Dashboard
          </Link>
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className={`text-[15px] font-extralight ${
                isDarkMode ? 'text-[#e0e6f5]' : 'text-[#00184f]'
              }`}>
                Hi, {user?.firstName || user?.email || 'User'}
              </span>
              <button
                onClick={logout}
                className={`relative text-[15px] font-extralight transition-colors duration-300 hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-[-2px] after:w-0 after:h-px after:bg-current after:transition-all after:duration-300 ${
                  isDarkMode
                    ? 'text-[#e0e6f5] hover:text-white'
                    : 'text-[#00184f]'
                }`}
              >
                Log Out
              </button>
            </div>
          ) : (
            <button
              onClick={openLogin}
              className={`relative text-[15px] font-extralight transition-colors duration-300 hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-[-2px] after:w-0 after:h-px after:bg-current after:transition-all after:duration-300 ${
                isDarkMode
                  ? 'text-[#e0e6f5] hover:text-white'
                  : 'text-[#00184f]'
              }`}
            >
              Log In
            </button>
          )}

          {/* Dark Mode Toggle - Desktop */}
          <button
            onClick={toggleTheme}
            className={`text-[15px] transition-colors duration-300 p-1.5 ${
              isDarkMode
                ? 'text-[#e0e6f5] hover:text-white'
                : 'text-[#00184f]'
            }`}
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
          <span className={`w-[6px] h-[6px] rounded-full transition-all duration-300 ${
            isDarkMode ? 'bg-[#e0e6f5]' : 'bg-black'
          }`}></span>
          <span className={`w-[6px] h-[6px] rounded-full transition-all duration-300 ${
            isDarkMode ? 'bg-[#e0e6f5]' : 'bg-black'
          }`}></span>
          <span className={`w-[6px] h-[6px] rounded-full transition-all duration-300 ${
            isDarkMode ? 'bg-[#e0e6f5]' : 'bg-black'
          }`}></span>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      <nav className={`md:hidden ${isMenuOpen ? 'flex' : 'hidden'} flex-col gap-2 px-5 py-2 z-[999] transition-all duration-300 backdrop-blur-md border-b border-white/20 dark:border-gray-700/20 w-full absolute top-full left-0 ${
        isDarkMode
          ? 'bg-gradient-to-r from-[#0a1128]/90 via-[#001233]/90 to-[#0a1128]/90'
          : 'bg-gradient-to-r from-[#daf0fa]/90 via-[#bceaff]/90 to-[#bceaff]/90'
      }`}>
        <div className="flex flex-col w-full">
          <Link
            to="/learn"
            onClick={closeMenu}
            className={`relative block py-2.5 text-[14px] transition-colors duration-300 hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-px after:bg-current after:transition-all after:duration-300 ${
              isDarkMode
                ? 'text-[#e0e6f5] hover:text-white'
                : 'text-black hover:text-[#333]'
            }`}
          >
            Learn
          </Link>
          <Link
            to="/build"
            onClick={closeMenu}
            className={`relative block py-2.5 text-[14px] transition-colors duration-300 hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-px after:bg-current after:transition-all after:duration-300 ${
              isDarkMode
                ? 'text-[#e0e6f5] hover:text-white'
                : 'text-black hover:text-[#333]'
            }`}
          >
            Build
          </Link>
          <Link
            to="/dashboard"
            onClick={closeMenu}
            className={`relative block py-2.5 text-[14px] transition-colors duration-300 hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-px after:bg-current after:transition-all after:duration-300 ${
              isDarkMode
                ? 'text-[#e0e6f5] hover:text-white'
                : 'text-black hover:text-[#333]'
            }`}
          >
            Dashboard
          </Link>
        </div>
        <div className="flex flex-col w-full">
          {isAuthenticated ? (
            <div className="py-2.5">
              <div className={`text-[14px] mb-2 ${
                isDarkMode ? 'text-[#e0e6f5]' : 'text-black'
              }`}>
                Hi, {user?.firstName || user?.email || 'User'}
              </div>
              <button
                onClick={() => {
                  closeMenu();
                  logout();
                }}
                className={`relative block py-2.5 text-[14px] transition-colors duration-300 hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-px after:bg-current after:transition-all after:duration-300 ${
                  isDarkMode
                    ? 'text-[#e0e6f5] hover:text-white'
                    : 'text-black hover:text-[#333]'
                }`}
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
                className={`relative block py-2.5 text-[14px] transition-colors duration-300 hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-px after:bg-current after:transition-all after:duration-300 ${
                  isDarkMode
                    ? 'text-[#e0e6f5] hover:text-white'
                    : 'text-black hover:text-[#333]'
                }`}
              >
                Log In
              </button>
            </div>
          )}
        </div>
        {/* XP Badge - Mobile */}
        <div className="py-2 w-full flex justify-start pl-4">
          <XPBadge />
        </div>
        {/* Dark Mode Toggle - Mobile */}
        <div className="w-full flex justify-start">
          <button
            onClick={toggleTheme}
            className={`text-[15px] transition-colors duration-300 p-1.5 ${
              isDarkMode
                ? 'text-[#e0e6f5] hover:text-white'
                : 'text-[#00184f]'
            }`}
            aria-label="Toggle dark mode"
          >
            <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
