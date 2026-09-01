import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useAuthModalContext } from '../context/AuthModalContext';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();
  const { openLogin, openSignup } = useAuthModalContext();
  const location = useLocation();
  const navigate = useNavigate();

  const isDarkMode = theme === 'dark';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const accountRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const [isDarkHeader, setIsDarkHeader] = useState(true);

  useEffect(() => {
    const checkDarkSection = () => {
      // Check all dark sections: Hero (#start, .tl-hero), Pricing (#pricing, .tl-pricing-section)
      const darkSections = document.querySelectorAll('#start, #pricing, .tl-pricing-section, .tl-hero');
      let isOverDark = false;

      darkSections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        // Navbar is at top 0-72px; detect if section intersects with navbar
        if (rect.top <= 65 && rect.bottom >= 35) {
          isOverDark = true;
        }
      });

      setIsDarkHeader(isOverDark);
    };

    window.addEventListener('scroll', checkDarkSection, { passive: true });
    window.addEventListener('resize', checkDarkSection);
    checkDarkSection();

    return () => {
      window.removeEventListener('scroll', checkDarkSection);
      window.removeEventListener('resize', checkDarkSection);
    };
  }, [location.pathname]);

  const isDarkNav = isDarkMode || isDarkHeader;

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && !event.target.closest('#menuButton')) {
        setMobileMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);
    logout();
    navigate('/');
  };

  const handleGetStartedClick = (e) => {
    e.preventDefault();
    if (typeof openSignup === 'function') {
      openSignup();
    } else {
      navigate('/signup');
    }
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    if (typeof openLogin === 'function') {
      openLogin();
    } else {
      navigate('/login');
    }
  };

  const firstName = user?.firstName || user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  const fullName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user?.name || user?.email?.split('@')[0] || 'Student');
  const userEmail = user?.email || 'student@techlearn.com';
  const userAvatar = user?.photoUrl || user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}&backgroundColor=04103d,3c83f6,1e293b`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent" style={{ background: 'transparent' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        /* Light Mode Defaults */
        .tl-navbar-root {
          font-family: 'Inter', sans-serif;
          --navy: #00113b;
          --green: #b2e96a;
          --green-text: #04103d;
          --heading: #00113b;
          --text: rgba(0, 17, 59, 0.88);
          --text-hover: #00113b;
          --muted: rgba(0, 17, 59, 0.6);
          --border: rgba(0, 17, 59, 0.12);
          --dropdown-bg: rgba(255, 255, 255, 0.98);
          --dropdown-border: rgba(0, 17, 59, 0.12);
          --dropdown-shadow: 0 20px 60px rgba(0, 17, 59, 0.15);
          --dropdown-action-bg: rgba(0, 17, 59, 0.04);
          --dropdown-action-hover: rgba(0, 17, 59, 0.08);
          --dropdown-action-border: rgba(0, 17, 59, 0.12);
          --dropdown-action-text: #00113b;
          --dropdown-action-hover-text: #00113b;
          --hamburger-color: #00113b;
          --theme-btn-bg: rgba(0, 17, 59, 0.06);
          --theme-btn-hover: rgba(0, 17, 59, 0.12);
          --theme-btn-color: #00113b;
        }

        /* Dark Mode or Hero Section Active */
        .tl-navbar-root.dark-theme,
        .dark .tl-navbar-root {
          --navy: #04103d;
          --green: #b2e96a;
          --green-text: #04103d;
          --heading: #ffffff;
          --text: rgba(255, 255, 255, 0.92);
          --text-hover: #ffffff;
          --muted: rgba(255, 255, 255, 0.65);
          --border: rgba(255, 255, 255, 0.12);
          --dropdown-bg: rgba(4, 16, 61, 0.98);
          --dropdown-border: rgba(255, 255, 255, 0.12);
          --dropdown-shadow: 0 24px 70px rgba(0, 0, 0, 0.45);
          --dropdown-action-bg: rgba(255, 255, 255, 0.04);
          --dropdown-action-hover: rgba(255, 255, 255, 0.08);
          --dropdown-action-border: rgba(255, 255, 255, 0.12);
          --dropdown-action-text: rgba(255, 255, 255, 0.85);
          --dropdown-action-hover-text: #ffffff;
          --hamburger-color: #ffffff;
          --theme-btn-bg: rgba(255, 255, 255, 0.06);
          --theme-btn-hover: rgba(255, 255, 255, 0.12);
          --theme-btn-color: #ffffff;
        }

        .tl-nav {
          width: 100%;
          height: 72px;
          padding: 0 38px 0 23px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          background: transparent;
        }

        .tl-nav-brand {
          display: flex;
          align-items: center;
          text-decoration: none;
          flex-shrink: 0;
          margin-left: 0;
        }

        .tl-nav-brand img {
          width: 44px;
          height: 44px;
          object-fit: contain;
          display: block;
          border-radius: 9px;
        }

        .tl-nav-right {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .tl-nav-links {
          display: flex;
          align-items: center;
          gap: 30px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .tl-nav-links a {
          position: relative;
          color: var(--text);
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
          white-space: nowrap;
          transition: color .2s ease;
        }

        .tl-nav-links a:hover {
          color: var(--text-hover);
        }

        .tl-sign-in {
          color: var(--text);
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
          white-space: nowrap;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: color .2s ease;
        }

        .tl-sign-in:hover {
          color: var(--text-hover);
        }

        .tl-get-started {
          height: 38px;
          padding: 0 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: var(--green);
          color: var(--green-text);
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
          border: none;
          cursor: pointer;
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .tl-get-started:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(178,233,106,.24);
        }

        .tl-account {
          position: relative;
        }

        .tl-account-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 8px 12px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: var(--text);
          font-family: inherit;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          cursor: pointer;
          transition: color .2s ease, background .2s ease;
        }

        .tl-account-button:hover {
          color: var(--text-hover);
          background: rgba(125,125,125,.08);
        }

        .tl-chevron {
          width: 7px;
          height: 7px;
          border-right: 1.5px solid currentColor;
          border-bottom: 1.5px solid currentColor;
          transform: rotate(45deg) translateY(-2px);
          transition: transform .2s ease;
        }

        .tl-account.open .tl-chevron {
          transform: rotate(225deg) translateY(-1px);
        }

        .tl-account-menu {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 280px;
          padding: 14px;
          border: 1px solid var(--dropdown-border);
          border-radius: 16px;
          background: var(--dropdown-bg);
          backdrop-filter: blur(20px);
          box-shadow: var(--dropdown-shadow);
          opacity: 0;
          visibility: hidden;
          transform: translateY(-6px);
          transition: opacity .18s ease, visibility .18s ease, transform .18s ease;
        }

        .tl-account.open .tl-account-menu {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .tl-profile-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 4px 5px 15px;
        }

        .tl-profile-avatar {
          width: 54px;
          height: 54px;
          display: block;
          object-fit: cover;
          border-radius: 50%;
          border: 2px solid var(--border);
          margin-bottom: 9px;
        }

        .tl-profile-name {
          color: var(--heading);
          font-size: 14px;
          font-weight: 600;
          line-height: 1.4;
        }

        .tl-profile-email {
          margin-top: 3px;
          color: var(--muted);
          font-size: 11.5px;
          font-weight: 400;
          line-height: 1.4;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .tl-profile-action {
          width: 100%;
          min-height: 44px;
          display: flex;
          align-items: center;
          border-radius: 9px;
          text-decoration: none;
          font-size: 12.5px;
          font-weight: 500;
          transition: background .18s ease, color .18s ease, border-color .18s ease;
          border: 1px solid var(--dropdown-action-border);
          background: var(--dropdown-action-bg);
          color: var(--dropdown-action-text);
          cursor: pointer;
        }

        .tl-manage-profile {
          gap: 10px;
          padding: 0 11px;
        }

        .tl-manage-profile:hover,
        .tl-sign-out:hover {
          background: var(--dropdown-action-hover);
          color: var(--dropdown-action-hover-text);
        }

        .tl-manage-logo {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .tl-manage-logo img {
          width: 24px;
          height: 24px;
          object-fit: contain;
          border-radius: 5px;
        }

        .tl-sign-out {
          justify-content: center;
          margin-top: 8px;
        }

        .tl-menu-button {
          width: 38px;
          height: 38px;
          display: none;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
          border-radius: 9px;
          background: var(--theme-btn-bg);
          cursor: pointer;
        }

        .tl-menu-icon {
          width: 16px;
          height: 12px;
          position: relative;
        }

        .tl-menu-icon span {
          position: absolute;
          left: 0;
          width: 100%;
          height: 1.5px;
          background: var(--hamburger-color);
          transition: transform .2s ease, top .2s ease;
        }

        .tl-menu-icon span:nth-child(1) { top: 0; }
        .tl-menu-icon span:nth-child(2) { top: 5px; }
        .tl-menu-icon span:nth-child(3) { top: 10px; }

        .tl-menu-button.active .tl-menu-icon span:nth-child(1) {
          top: 5px;
          transform: rotate(45deg);
        }
        .tl-menu-button.active .tl-menu-icon span:nth-child(2) {
          opacity: 0;
        }
        .tl-menu-button.active .tl-menu-icon span:nth-child(3) {
          top: 5px;
          transform: rotate(-45deg);
        }

        .tl-mobile-menu {
          display: none;
          position: absolute;
          top: 72px;
          left: 16px;
          right: 16px;
          padding: 10px;
          border: 1px solid var(--dropdown-border);
          border-radius: 12px;
          background: var(--dropdown-bg);
          backdrop-filter: blur(18px);
          box-shadow: var(--dropdown-shadow);
        }

        .tl-mobile-menu.active {
          display: block;
        }

        .tl-mobile-menu a,
        .tl-mobile-menu button {
          display: flex;
          align-items: center;
          width: 100%;
          min-height: 44px;
          padding: 0 12px;
          border-radius: 8px;
          color: var(--text);
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 500;
          background: transparent;
          border: none;
          text-align: left;
          cursor: pointer;
        }

        .tl-mobile-menu a:hover,
        .tl-mobile-menu button:hover {
          background: var(--dropdown-action-hover);
          color: var(--text-hover);
        }

        .tl-theme-toggle-btn {
          background: transparent;
          border: none;
          outline: none;
          width: 36px;
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--text);
          cursor: pointer;
          transition: color .2s ease, transform .2s ease;
        }

        .tl-theme-toggle-btn:hover {
          color: var(--text-hover);
          transform: scale(1.08);
        }

        @media (max-width: 760px) {
          .tl-nav {
            height: 68px;
            padding: 0 16px;
          }
          .tl-nav-brand img {
            width: 34px;
            height: 34px;
          }
          .tl-nav-links,
          .tl-sign-in,
          .tl-account {
            display: none;
          }
          .tl-nav-right {
            gap: 10px;
          }
          .tl-get-started {
            height: 36px;
            padding: 0 14px;
            font-size: 12px;
          }
          .tl-menu-button {
            display: flex;
          }
          .tl-mobile-menu {
            top: 68px;
          }
        }

        @media (max-width: 380px) {
          .tl-nav {
            padding: 0 12px 0 8px;
          }
          .tl-get-started {
            padding: 0 10px;
            font-size: 11px;
          }
        }
      `}</style>

      <div className={`tl-navbar-root ${isDarkNav ? 'dark-theme' : ''} ${scrollY > 30 ? 'scrolled' : ''}`}>
        <nav className="tl-nav">
          {/* BRAND */}
          <Link
            to="/"
            className="tl-nav-brand"
            aria-label="TechLearn"
          >
            <img
              src={isDarkNav ? "/logoo2.png" : "/logoo-small.webp"}
              alt="TechLearn"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = isDarkNav ? "/logoo2-small.webp" : "/logoo-small.webp";
              }}
            />
          </Link>

          {/* RIGHT SIDE */}
          <div className="tl-nav-right">
            {/* DESKTOP LINKS */}
            <ul className="tl-nav-links">
              <li>
                <Link to="/learn">Learn</Link>
              </li>
              {!isAuthenticated && (
                <li>
                  <Link to="/roadmaps">Roadmaps</Link>
                </li>
              )}
              <li>
                <Link to="/jobs">Hiring</Link>
              </li>
              {isAuthenticated && (
                <li>
                  <Link to="/dashboard">Dashboard</Link>
                </li>
              )}
            </ul>

            {/* LOGGED OUT STATE */}
            {!isAuthenticated ? (
              <>
                {/* SIGN IN */}
                <button
                  type="button"
                  onClick={handleLoginClick}
                  className="tl-sign-in"
                >
                  Log in
                </button>

                {/* PRIMARY CTA */}
                <button
                  type="button"
                  onClick={handleGetStartedClick}
                  className="tl-get-started"
                >
                  Get started
                </button>
              </>
            ) : (
              /* LOGGED IN ACCOUNT DROPDOWN */
              <div
                className={`tl-account ${accountMenuOpen ? 'open' : ''}`}
                ref={accountRef}
              >
                <button
                  className="tl-account-button"
                  id="accountButton"
                  type="button"
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="true"
                  onClick={() => setAccountMenuOpen((prev) => !prev)}
                >
                  Hi, {firstName}
                  <span className="tl-chevron"></span>
                </button>

                {/* PROFILE DROPDOWN MENU */}
                <div className="tl-account-menu" id="accountMenu">
                  {/* AVATAR + NAME + EMAIL */}
                  <div className="tl-profile-header">
                    <img
                      src={userAvatar}
                      alt={fullName}
                      className="tl-profile-avatar"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/logoo2-small.webp";
                      }}
                    />
                    <div className="tl-profile-name">{fullName}</div>
                    <div className="tl-profile-email">{userEmail}</div>
                  </div>

                  {/* MANAGE PROFILE (Logo removed) */}
                  <Link
                    to="/dashboard/profile"
                    className="tl-profile-action tl-manage-profile"
                    onClick={() => setAccountMenuOpen(false)}
                  >
                    <User size={16} />
                    <span>Manage your profile</span>
                  </Link>

                  {/* THEME TOGGLE INSIDE DROPDOWN FOR LOGGED IN USERS */}
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="tl-profile-action"
                    style={{ marginTop: '8px', padding: '0 12px', justifyContent: 'space-between' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                      <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </span>
                    <span style={{ fontSize: '11px', opacity: 0.65 }}>Switch</span>
                  </button>

                  {/* SIGN OUT */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="tl-profile-action tl-sign-out"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}

            {/* MOBILE HAMBURGER BUTTON */}
            <button
              className={`tl-menu-button ${mobileMenuOpen ? 'active' : ''}`}
              id="menuButton"
              type="button"
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              <span className="tl-menu-icon">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
          </div>

          {/* MOBILE MENU DROPDOWN */}
          <div
            className={`tl-mobile-menu ${mobileMenuOpen ? 'active' : ''}`}
            id="mobileMenu"
            ref={mobileMenuRef}
          >
            <Link to="/learn">Learn</Link>
            <Link to="/roadmaps">Roadmaps</Link>
            <Link to="/jobs">Hiring</Link>

            {isAuthenticated ? (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/dashboard/profile">Manage your profile</Link>
                <button type="button" onClick={handleLogout}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={handleLoginClick}>
                  Log in
                </button>
                <button
                  type="button"
                  onClick={handleGetStartedClick}
                  style={{ color: 'var(--green)', fontWeight: '700' }}
                >
                  Get started →
                </button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
