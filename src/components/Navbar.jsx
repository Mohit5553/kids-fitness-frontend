import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { getUser, clearAuth } from '../utils/auth.js';
import LocationSelect from './LocationSelect.jsx';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/programs', label: 'Programs' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' }
];

export default function Navbar() {
  const navigate = useNavigate();
  const user = getUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const closeMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="site-header sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="page-shell flex items-center justify-between py-3 relative z-20">
          <NavLink to="/" onClick={closeMenu} className="flex items-center gap-3 group">
            <span className="brand-mark group-hover:scale-110 transition-transform">LS</span>
            <span className="font-display text-2xl font-black tracking-tight text-brand-blue hidden sm:block">Little Sparks Gym</span>
            <span className="font-display text-xl font-black tracking-tight text-brand-blue sm:hidden">Little Sparks</span>
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
            {user && (user.role === 'admin' || user.role === 'superadmin') ? (
              <LocationSelect allowAll={user.role === 'superadmin'} />
            ) : null}
            {user ? (
              <>
                <NavLink
                  to={user.role === 'admin' ? '/admin' : '/dashboard'}
                  className="text-sm font-bold text-brand-black/60 hover:text-brand-black"
                >
                  Dashboard
                </NavLink>
                <NavLink to="/calendar" className="text-sm font-bold text-brand-black/60 hover:text-brand-black">
                  Calendar
                </NavLink>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border-2 border-brand-black/5 px-6 py-2 text-sm font-bold text-brand-black hover:bg-brand-black/5 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <NavLink to="/login" className="text-sm font-bold text-brand-black/60 hover:text-brand-black">
                Member Login
              </NavLink>
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
        className={`fixed inset-x-0 top-[72px] h-[calc(100vh-72px)] bg-white/95 backdrop-blur-xl z-40 transition-all duration-300 ease-in-out xl:hidden overflow-y-auto ${
          isMobileMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-4'
        }`}
      >
        <div className="page-shell py-8 flex flex-col gap-6">
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
            {user && (user.role === 'admin' || user.role === 'superadmin') ? (
              <div className="mb-2">
                 <LocationSelect allowAll={user.role === 'superadmin'} />
              </div>
            ) : null}
            {user ? (
              <>
                <NavLink
                  to={user.role === 'admin' ? '/admin' : '/dashboard'}
                  onClick={closeMenu}
                  className="text-lg font-bold text-brand-black/80 hover:text-brand-black"
                >
                  Dashboard
                </NavLink>
                <NavLink 
                  to="/calendar" 
                  onClick={closeMenu}
                  className="text-lg font-bold text-brand-black/80 hover:text-brand-black"
                >
                  Calendar
                </NavLink>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-left text-lg font-bold text-coral hover:text-red-500"
                >
                  Logout
                </button>
              </>
            ) : (
              <NavLink 
                to="/login" 
                onClick={closeMenu}
                className="text-lg font-bold text-brand-black/80 hover:text-brand-black"
              >
                Member Login
              </NavLink>
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
