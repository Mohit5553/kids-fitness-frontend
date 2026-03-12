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

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  return (
    <header className="site-header sticky top-0 z-50">
      <div className="page-shell flex items-center justify-between py-3">
<<<<<<< HEAD
        <NavLink to="/" className="flex items-center gap-3 group">
          <span className="brand-mark group-hover:scale-110 transition-transform">LS</span>
          <span className="font-display text-2xl font-black tracking-tight text-brand-blue">Little Sparks Gym</span>
        </NavLink>
        <nav className="pill-nav hidden items-center gap-6 rounded-full px-8 py-3 text-sm font-bold md:flex border border-brand-navy/5">
=======
        <NavLink to="/" className="flex items-center gap-3">
          <span className="brand-mark">LS</span>
          <span className="font-display text-xl text-ink">Little Sparks Gym</span>
        </NavLink>
        <nav className="pill-nav hidden items-center gap-4 rounded-full px-5 py-2 text-sm font-medium md:flex">
>>>>>>> 5ba2eb2c538f7bb373cc2fcea42d65cc791058de
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
<<<<<<< HEAD
                `nav-link transition-colors ${isActive ? 'nav-link-active !text-brand-black' : 'text-brand-black/60 hover:text-brand-black'}`
=======
                `nav-link ${isActive ? 'nav-link-active' : ''}`
>>>>>>> 5ba2eb2c538f7bb373cc2fcea42d65cc791058de
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {user && (user.role === 'admin' || user.role === 'superadmin') ? (
            <LocationSelect allowAll={user.role === 'superadmin'} />
          ) : null}
          {user ? (
            <>
              <NavLink
                to={user.role === 'admin' ? '/admin' : '/dashboard'}
<<<<<<< HEAD
                className="text-sm font-bold text-brand-black/60 hover:text-brand-black"
              >
                Dashboard
              </NavLink>
              <NavLink to="/calendar" className="text-sm font-bold text-brand-black/60 hover:text-brand-black">
=======
                className="text-sm font-semibold text-ink/70 hover:text-ink"
              >
                Dashboard
              </NavLink>
              <NavLink to="/calendar" className="text-sm font-semibold text-ink/70 hover:text-ink">
>>>>>>> 5ba2eb2c538f7bb373cc2fcea42d65cc791058de
                Calendar
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
<<<<<<< HEAD
                className="rounded-full border-2 border-brand-black/5 px-6 py-2 text-sm font-bold text-brand-black hover:bg-brand-black/5 transition-colors"
=======
                className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold text-ink"
>>>>>>> 5ba2eb2c538f7bb373cc2fcea42d65cc791058de
              >
                Logout
              </button>
            </>
          ) : (
<<<<<<< HEAD
            <NavLink to="/login" className="text-sm font-bold text-brand-black/60 hover:text-brand-black">
              Member Login
            </NavLink>
          )}
          <NavLink to="/book-trial" className="rounded-full bg-brand-blue px-6 py-2 text-sm font-black text-white shadow-lg hover:scale-105 active:scale-95 transition-all">
=======
            <NavLink to="/login" className="text-sm font-semibold text-ink/70 hover:text-ink">
              Member Login
            </NavLink>
          )}
          <NavLink to="/book-trial" className="rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white">
>>>>>>> 5ba2eb2c538f7bb373cc2fcea42d65cc791058de
            Book Trial
          </NavLink>
        </div>
      </div>
    </header>
  );
}
