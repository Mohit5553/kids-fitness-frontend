import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * A reusable header for administrative pages that dynamically reflects the user's role.
 * @param {Object} props
 * @param {string} props.title - The specific management title (e.g., "Trainer Master")
 * @param {string} props.description - A brief explanation of the page
 * @param {React.ReactNode} [props.actions] - Optional buttons or elements for the right side
 */
export default function AdminHeader({ title, description, actions }) {
  const { user } = useAuth();
  const roleName = user?.role || 'Admin';

  const [isLive, setIsLive] = React.useState(localStorage.getItem('systemMode') !== 'uat');

  const toggleMode = () => {
    const newMode = isLive ? 'uat' : 'live';
    localStorage.setItem('systemMode', newMode);
    setIsLive(!isLive);
    // Optionally alert or toast
    window.location.reload();
  };

  return (
    <section className={`relative overflow-hidden rounded-[32px] p-8 text-white shadow-glow mb-8 transition-all duration-500 ${isLive ? 'bg-gradient-to-r from-ocean to-moss' : 'bg-gradient-to-r from-amber-600 to-orange-500'}`}>
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
              {roleName} Center
            </p>
            {user?.role === 'superadmin' && (
              <div 
                onClick={toggleMode}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 cursor-pointer hover:bg-white/20 transition-all active:scale-95"
              >
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isLive ? 'bg-emerald-400' : 'bg-amber-300'}`} />
                <span className="text-[9px] font-black uppercase tracking-[0.1em]">
                  {isLive ? 'LIVE MODE' : 'UAT MODE'}
                </span>
              </div>
            )}
            {(user?.role !== 'superadmin' && !isLive) && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 opacity-80">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                <span className="text-[9px] font-black uppercase tracking-[0.1em]">TEST ENVIRONMENT (UAT)</span>
              </div>
            )}
          </div>
          <h1 className="mt-1 font-display text-3xl md:text-4xl capitalize">
            {roleName} {title}
          </h1>
          <p className="mt-2 text-sm text-white/80 max-w-2xl">{description}</p>
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      <div className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-16 left-10 h-48 w-48 rounded-full bg-white/10" />
    </section>
  );
}
