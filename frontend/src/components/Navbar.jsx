import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

// Social links shown in the logged-in mobile menu (transparent pixel-art icons, so they work on light and dark).
const SOCIAL_LINKS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/techlearnsolutions', icon: '/social_icons/linkedin.png' },
  { label: 'YouTube', href: 'https://www.youtube.com/@techlearnsolutions8014', icon: '/social_icons/youtube.png' },
  { label: 'WhatsApp', href: 'https://wa.me/919676663136?text=Hi%20there!%20I%20want%20to%20know%20more%20about%20your%20courses', icon: '/social_icons/whatsapp.png' },
  { label: 'Instagram', href: 'https://www.instagram.com/techlearn_in/', icon: '/social_icons/instagram.png' },
];

const MOBILE_MEMBER_LINKS = [
  ['Dashboard', '/dashboard'],
  ['Learn', '/learn'],
  ['Roadmaps', '/roadmaps'],
  ['Leaderboard', '/dashboard/leaderboard'],
  ['Performance', '/dashboard/performance'],
  ['Hiring', '/jobs'],
  ['Profile', '/dashboard/profile'],
];

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isDarkMode = theme === 'dark';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [sectionBackground, setSectionBackground] = useState(null);
  const [navBgImage, setNavBgImage] = useState(null);
  const [isOverHero, setIsOverHero] = useState(() => location.pathname === '/');


  const accountRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // The landing page opens on the dark hero section. Initialize this state
  // from the route so the navbar is visible before the lazy-loaded hero mounts.
  const [isOverDarkSection, setIsOverDarkSection] = useState(
    () => location.pathname === '/' || isDarkMode
  );

  useEffect(() => {
    const checkDarkSection = () => {
      const scrollPos = window.scrollY || document.documentElement.scrollTop || 0;
      setScrollY(scrollPos);

      // Section under the navbar center (navbar height is ~72px, so sample at Y = 36px)
      const sampleY = 36;
      const allSections = Array.from(document.querySelectorAll('.tl-landing > section, footer'));
      
      let currentSection = allSections.find((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= sampleY && rect.bottom >= sampleY;
      });

      // Fallback: if between sections or gap, find section that overlaps the navbar area (0 to 72)
      if (!currentSection) {
        currentSection = allSections.find((section) => {
          const rect = section.getBoundingClientRect();
          return rect.top < 72 && rect.bottom > 0;
        });
      }

      // Check whether current section is a dark section:
      // Hero (#start / .tl-hero), Pricing (#pricing / .tl-pricing-section), Footer (footer) are always dark (#04083d / #00113b).
      // Journey (#journey / .journey-scroll) is dark in dark mode (#04083d) and light in light mode (#e0eef4).
      // Problem (#problem), Results (#results), FAQs (#faqs), CTA (#start-program) are light (#d6ebf4) in light mode.
      // Decide from the section's actual painted background (landing sections stay light even when the
      // site theme is dark), so the navbar never depends on the global theme here.
      let isOverDark = scrollPos < 100;
      if (currentSection) {
        const paintEl = currentSection.matches('#journey, .journey-scroll')
          ? (currentSection.querySelector('.journey-sticky') || currentSection)
          : currentSection;
        const m = getComputedStyle(paintEl).backgroundColor.match(/[\d.]+/g);
        if (m && m.length >= 3 && !(m.length >= 4 && parseFloat(m[3]) === 0)) {
          const lum = (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255;
          isOverDark = lum < 0.5;
        } else {
          isOverDark = currentSection.matches('#start, .tl-hero, #pricing, .tl-pricing-section, footer');
        }
      }

      // Hero check for transparent navbar background
      const heroEl = document.querySelector("#start, .tl-hero");
      const heroRect = heroEl ? heroEl.getBoundingClientRect() : null;
      setIsOverHero(location.pathname === "/" && (heroRect ? heroRect.top <= 65 && heroRect.bottom >= 72 : scrollPos < 10));

      const readPaint = (el) => {
        if (!el) return null;
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") return null;
        const color = cs.backgroundColor;
        const hasColor = color && color !== "rgba(0, 0, 0, 0)" && color !== "transparent";
        const hasImage = cs.backgroundImage && cs.backgroundImage !== "none";
        if (!hasColor && !hasImage) return null;
        return { color: hasColor ? color : null, image: hasImage ? cs.backgroundImage : null };
      };

      const detectPageSurface = () => {
        // 1. Landing page section under navbar (sections scroll, so solid color only)
        if (currentSection) {
          const paintEl = currentSection.matches('#journey, .journey-scroll')
            ? (currentSection.querySelector('.journey-sticky') || currentSection)
            : currentSection;
          const p = readPaint(paintEl);
          if (p && p.color) return { color: p.color, image: null };
        }

        // 2. Full-viewport fixed backdrop (what every page paints behind its content).
        //    Copy color AND gradient so the navbar is a continuation of the page background.
        const fixedEls = Array.from(document.querySelectorAll("div"))
          .filter((el) => {
            const cs = getComputedStyle(el);
            if (cs.position !== "fixed") return false;
            const r = el.getBoundingClientRect();
            return r.width >= window.innerWidth * 0.95 && r.height >= window.innerHeight * 0.95 && r.top <= 1 && r.left <= 1;
          })
          .reverse();
        for (const el of fixedEls) {
          const p = readPaint(el);
          if (p) return p;
        }

        // 3. Main wrappers, then body/html
        const wrappers = Array.from(document.querySelectorAll("main, [class*='min-h-screen'], #root > div"));
        for (const el of wrappers) {
          const p = readPaint(el);
          if (p) return p;
        }
        const b = readPaint(document.body) || readPaint(document.documentElement);
        if (b) return b;

        return { color: isDarkMode ? '#050b2f' : '#daf0fa', image: null };
      };

      const resolved = detectPageSurface();
      setSectionBackground(resolved.color || (isDarkMode ? '#050b2f' : '#daf0fa'));
      setNavBgImage(resolved.image);

      const hasSections = allSections.length > 0;
      if (!hasSections) {
        setIsOverDarkSection(isDarkMode);
      } else {
        setIsOverDarkSection(isOverDark);
      }
    };

    window.addEventListener('scroll', checkDarkSection, { passive: true, capture: true });
    window.addEventListener('resize', checkDarkSection);
    checkDarkSection();
    const resample = [
      setTimeout(checkDarkSection, 50),
      setTimeout(checkDarkSection, 150),
      setTimeout(checkDarkSection, 400),
      setTimeout(checkDarkSection, 1000)
    ];

    return () => {
      resample.forEach(clearTimeout);
      window.removeEventListener('scroll', checkDarkSection, { capture: true });
      window.removeEventListener('resize', checkDarkSection);
    };
  }, [location.pathname, isDarkMode]);

  // If over dark section -> use dark theme styling (white text / dark dropdown)
  // If over light section -> use light theme styling (dark text / light dropdown)
  // On landing page (/), adaptive styling detects section under navbar (hero vs problem vs results etc.)
  const isLandingPage = location.pathname === '/';
  const isDarkNav = isLandingPage ? isOverDarkSection : isDarkMode;
  const navSurface = sectionBackground || (isDarkNav ? (isLandingPage ? '#04083d' : '#050b2f') : '#daf0fa');

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

  // Keep the page behind the full-screen menu from scrolling
  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [mobileMenuOpen]);

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
    navigate('/onboarding');
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    navigate('/login');
  };

  const firstName = user?.firstName || user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  const fullName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user?.name || user?.email?.split('@')[0] || 'Student');
  const userEmail = user?.email || 'student@techlearn.com';
  const userAvatar = user?.photoUrl || user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}&backgroundColor=04103d,3c83f6,1e293b`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50" style={{ background: mobileMenuOpen ? navSurface : 'transparent' }}>
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
          --dropdown-bg: #ffffff;
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
          --menu-page-bg: #d8eef5;
        }

        /* Dark Section Active or Dark Page Fallback */
        .tl-navbar-root.dark-theme {
          --navy: #04103d;
          --green: #b2e96a;
          --green-text: #04103d;
          --heading: #ffffff;
          --text: rgba(255, 255, 255, 0.92);
          --text-hover: #ffffff;
          --muted: rgba(255, 255, 255, 0.65);
          --border: rgba(255, 255, 255, 0.12);
          --dropdown-bg: #050b2f;
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
          --menu-page-bg: #050b2f;
        }

        .tl-navbar-root {
          background-color: var(--navbar-bg, #daf0fa);
          background-image: var(--navbar-bg-image, none);
          background-size: 100vw 100vh;
          background-position: 0 0;
          background-attachment: fixed;
          border-bottom: 1px solid var(--border);
          transition: background-color .2s ease, border-color .2s ease;
        }

        .tl-navbar-root.dark-theme {
          background-color: var(--navbar-bg, #04083d);
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
          border-radius: 999px;
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
          border: none;
          border-radius: 9px;
          background: transparent;
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

        @media (min-width: 761px) {
          body.has-app-sidebar .tl-nav-links {
            display: none !important;
          }
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
          /* Full-page menu: covers everything under the navbar, like the course chapter drawer */
          .tl-mobile-menu {
            position: fixed;
            top: 68px;
            left: 0;
            right: 0;
            bottom: 0;
            padding: 12px 20px 32px;
            border: none;
            border-radius: 0;
            background: var(--menu-page-bg);
            backdrop-filter: none;
            box-shadow: none;
            overflow-y: auto;
            z-index: 40;
          }
          .tl-mobile-menu a,
          .tl-mobile-menu button {
            min-height: 56px;
            padding: 0 4px;
            border-radius: 0;
            border-bottom: 1px solid var(--border);
            font-size: 18px;
            font-weight: 600;
            color: var(--heading);
          }
          .tl-mobile-menu.active {
            display: flex;
            flex-direction: column;
          }
          .tl-mobile-menu a:last-child,
          .tl-mobile-menu button:last-child {
            border-bottom: none;
          }
          .tl-mobile-links {
            border-top: 1px solid var(--border);
            margin-top: 8px;
          }
          .tl-mobile-links a {
            font-weight: 400;
            font-size: 18px;
            color: var(--text);
          }
          .tl-mobile-links a:last-child {
            border-bottom: 1px solid var(--border);
          }
          .tl-mobile-links a.active {
            font-weight: 700;
            color: var(--heading);
          }
          .tl-mobile-footer {
            margin-top: auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 18px 4px 4px;
            border-top: 1px solid var(--border);
          }
          .tl-mobile-menu .tl-mobile-logout {
            width: auto;
            min-height: 0;
            padding: 6px 0;
            border: none;
            font-size: 13px;
            font-weight: 500;
          }
          .tl-mobile-socials {
            display: flex;
            gap: 12px;
          }
          .tl-mobile-socials img {
            width: 30px;
            height: 30px;
            display: block;
            image-rendering: pixelated;
          }
          .tl-mobile-menu .tl-mobile-socials a {
            width: auto;
            min-height: 0;
            padding: 0;
            border: none;
            font-size: 30px;
            line-height: 1;
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

      <div
        className={`tl-navbar-root ${isDarkNav ? 'dark-theme' : ''} ${scrollY > 30 ? 'scrolled' : ''}`}
        style={{
          '--navbar-bg': navSurface,
          '--navbar-bg-image': navBgImage || 'none',
          '--dropdown-bg': isDarkMode ? '#050b2f' : '#ffffff',
          '--menu-page-bg': navSurface,
        }}
      >
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
              <li>
                <Link to="/roadmaps">Roadmaps</Link>
              </li>
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
            {isAuthenticated ? (
              <>
                <div className="tl-mobile-links">
                  {MOBILE_MEMBER_LINKS.map(([label, to]) => {
                    const isActive = to === '/dashboard' ? location.pathname === to : location.pathname.startsWith(to);
                    return (
                      <Link key={to} to={to} className={isActive ? 'active' : ''}>{label}</Link>
                    );
                  })}
                </div>
                <div className="tl-mobile-footer">
                  <button type="button" className="tl-mobile-logout" onClick={handleLogout}>Logout</button>
                  <div className="tl-mobile-socials">
                    {SOCIAL_LINKS.map(({ label, href, icon }) => (
                      <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                        <img src={icon} alt="" />
                      </a>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/learn">Learn</Link>
                <Link to="/roadmaps">Roadmaps</Link>
                <Link to="/jobs">Hiring</Link>
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
