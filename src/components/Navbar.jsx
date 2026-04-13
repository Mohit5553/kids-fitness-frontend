import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { getUser, clearAuth, getRoleSlug } from '../utils/auth.js';
import { useAuth } from '../context/AuthContext.jsx';
import LocationSelect from './LocationSelect.jsx';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/programs', label: 'Programs' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/help', label: 'Help' },
  { to: '/contact', label: 'Contact' }
];

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getRoleLabel(user) {
  if (!user) return null;
  if (user.role === 'superadmin' || user.role === 'admin') return 'Admin';
  if (user.permissions && user.permissions.length > 0) return user.role; // Custom role name
  if (user.role === 'trainer') return 'Trainer';
  return 'User';
}

function getRoleColor(role) {
  return { bg: '#1a6bff', text: '#fff' };
}

export default function Navbar({ className = '' }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
    navigate('/');
  };

  const closeMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isStaff = user && (user.role === 'admin' || user.role === 'superadmin' || (user.permissions && user.permissions.length > 0));
  const roleLabel = getRoleLabel(user);
  const roleColor = user ? getRoleColor(user.role) : null;
  const initials = user ? getInitials(user.name) : null;
  const dashboardPath = user
    ? `/${getRoleSlug(user.role)}`
    : '/login';

  return (
    <>
      <header className={`site-header sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm ${className}`}>
        <div className="page-shell flex items-center justify-between py-3 relative z-20">
          <NavLink to="/" onClick={closeMenu} className="flex items-center gap-3 group">
            <span className="brand-mark group-hover:scale-110 transition-transform">JTS</span>
            <span className="font-display text-2xl font-black tracking-tight text-brand-blue hidden sm:block">JTS Booking</span>
            <span className="font-display text-xl font-black tracking-tight text-brand-blue sm:hidden">JTS Booking</span>
          </NavLink>

          {/* Desktop Nav */}
          <nav className="pill-nav hidden xl:flex items-center gap-6 rounded-full px-8 py-3 text-sm font-bold border border-brand-navy/5">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `nav-link transition-colors ${isActive ? 'nav-link-active !text-brand-black' : 'text-brand-black/60 hover:text-brand-black'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden xl:flex items-center gap-3">
            {isStaff ? (
              <LocationSelect allowAll={user.role === 'superadmin'} />
            ) : null}

            {user ? (
              /* ── Profile Dropdown ── */
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 rounded-full border-2 border-brand-black/10 px-3 py-1.5 hover:border-brand-blue/40 hover:bg-brand-blue/5 transition-all group"
                  aria-label="Profile menu"
                >
                  {/* Avatar circle */}
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white select-none overflow-hidden"
                    style={{ background: roleColor.bg }}
                  >
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${user.avatarUrl}`} alt="" className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </span>
                  {/* Name / Admin label */}
                  <span className="text-sm font-bold text-brand-black max-w-[120px] truncate">
                    {isStaff ? (user.role === 'admin' || user.role === 'superadmin' ? 'Admin' : (user.firstName || user.name)) : (user.firstName || user.name)}
                  </span>
                  {/* Chevron */}
                  <svg
                    className={`w-4 h-4 text-brand-black/40 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-brand-black/5 py-2 z-50 animate-fadeIn">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-brand-black/5">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-10 h-10 rounded-full flex items-center justify-center text-base font-black text-white shrink-0 overflow-hidden"
                          style={{ background: roleColor.bg }}
                        >
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${user.avatarUrl}`} alt="" className="w-full h-full object-cover" />
                          ) : (
                            initials
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-brand-black truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-brand-black/50 truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <NavLink
                        to={dashboardPath}
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-brand-black/70 hover:bg-brand-blue/5 hover:text-brand-blue transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Dashboard
                      </NavLink>
                      <NavLink
                        to="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-brand-black/70 hover:bg-brand-blue/5 hover:text-brand-blue transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Edit Profile
                      </NavLink>
                      <NavLink
                        to="/calendar"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-brand-black/70 hover:bg-brand-blue/5 hover:text-brand-blue transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Calendar
                      </NavLink>
                      {isStaff && (
                         <NavLink
                           to={`/${getRoleSlug(user.role)}/extensions`}
                           onClick={() => setIsProfileOpen(false)}
                           className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-brand-black/70 hover:bg-brand-blue/5 hover:text-brand-blue transition-colors"
                         >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                           </svg>
                           Extensions
                         </NavLink>
                      )}
                    </div>

                    <div className="border-t border-brand-black/5 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden xl:flex items-center gap-4">
                <NavLink to="/lookup" className="text-sm font-bold text-brand-black/60 hover:text-brand-black transition-colors rounded-full border border-brand-black/10 px-5 py-2 hover:bg-brand-black/5">
                  My Booking
                </NavLink>
                <NavLink to="/login" className="text-sm font-bold text-brand-black/60 hover:text-brand-black">
                  Member Login
                </NavLink>
              </div>
            )}

            <NavLink to="/book-trial" className="rounded-full bg-brand-blue px-6 py-2 text-sm font-black text-white shadow-lg hover:scale-105 active:scale-95 transition-all">
              Book Trial
            </NavLink>
          </div>

          {/* Mobile Toggle Button */}
          <button
            className="xl:hidden p-2 text-brand-black focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className={`w-8 h-8 transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      <div
        className={`fixed inset-x-0 top-[72px] h-[calc(100vh-72px)] bg-white/95 backdrop-blur-xl z-40 transition-all duration-300 ease-in-out xl:hidden overflow-y-auto ${isMobileMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-4'
          }`}
      >
        <div className="page-shell py-8 flex flex-col gap-6">

          {/* Mobile Profile Card */}
          {user && (
            <div
              className="flex items-center gap-4 p-4 rounded-2xl border"
              style={{
                background: roleColor.bg + '0d',
                borderColor: roleColor.bg + '33'
              }}
            >
              <span
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black text-white shrink-0 overflow-hidden"
                style={{ background: roleColor.bg }}
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${user.avatarUrl}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </span>
              <div className="min-w-0">
                <p className="font-bold text-brand-black truncate">
                  {user.name}
                </p>
                <p className="text-xs text-brand-black/50 truncate">{user.email}</p>
              </div>
            </div>
          )}

          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `text-2xl font-display font-bold transition-colors ${isActive ? 'text-brand-blue' : 'text-brand-black hover:text-brand-blue'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="h-px w-full bg-brand-black/5 my-4"></div>

          <div className="flex flex-col gap-4 pb-12">
            {isStaff ? (
              <div className="mb-2 px-1">
                <LocationSelect allowAll={user.role === 'superadmin'} />
              </div>
            ) : null}
            {user ? (
              <>
                <NavLink
                  to={dashboardPath}
                  onClick={closeMenu}
                  className="text-lg font-bold text-brand-black/80 hover:text-brand-black"
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/profile"
                  onClick={closeMenu}
                  className="text-lg font-bold text-brand-black/80 hover:text-brand-black"
                >
                  Edit Profile
                </NavLink>
                <NavLink
                  to="/calendar"
                  onClick={closeMenu}
                  className="text-lg font-bold text-brand-black/80 hover:text-brand-black"
                >
                  Calendar
                </NavLink>
                <NavLink
                  to="/lookup"
                  onClick={closeMenu}
                  className="text-lg font-bold text-brand-blue"
                >
                  Check Booking Status
                </NavLink>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-left text-lg font-bold text-red-500 hover:text-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/lookup"
                  onClick={closeMenu}
                  className="text-lg font-bold text-brand-blue"
                >
                  Check Booking Status
                </NavLink>
                <NavLink
                  to="/login"
                  onClick={closeMenu}
                  className="text-lg font-bold text-brand-black/80 hover:text-brand-black"
                >
                  Member Login
                </NavLink>
              </>
            )}
            <NavLink
              to="/book-trial"
              onClick={closeMenu}
              className="mt-4 text-center rounded-full bg-brand-blue px-6 py-4 text-lg font-black text-white shadow-lg active:scale-95 transition-all"
            >
              Book Trial
            </NavLink>
          </div>
        </div>
      </div>
    </>
  );
}
