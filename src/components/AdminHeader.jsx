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

  return (
    <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-ocean to-moss p-8 text-white shadow-glow mb-8">
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
            {roleName} Center
          </p>
          <h1 className="mt-3 font-display text-3xl md:text-4xl capitalize">
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
