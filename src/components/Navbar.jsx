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
        <NavLink to="/" className="flex items-center gap-3">
          <span className="brand-mark">LS</span>
          <span className="font-display text-xl text-ink">Little Sparks Gym</span>
        </NavLink>
        <nav className="pill-nav hidden items-center gap-4 rounded-full px-5 py-2 text-sm font-medium md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link-active' : ''}`
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
                className="text-sm font-semibold text-ink/70 hover:text-ink"
              >
                Dashboard
              </NavLink>
              <NavLink to="/calendar" className="text-sm font-semibold text-ink/70 hover:text-ink">
                Calendar
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold text-ink"
              >
                Logout
              </button>
            </>
          ) : (
            <NavLink to="/login" className="text-sm font-semibold text-ink/70 hover:text-ink">
              Member Login
            </NavLink>
          )}
          <NavLink to="/book-trial" className="rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white">
            Book Trial
          </NavLink>
        </div>
      </div>
    </header>
  );
}
