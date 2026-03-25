import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';
import { getUser } from '../../utils/auth.js';

const adminActions = [
  { to: '/admin/classes', title: 'Classes', desc: 'Create and update programs.', perm: 'classes:view' },
  { to: '/admin/sessions', title: 'Session calendar', desc: 'Schedule classes and copy QR tokens.', perm: 'sessions:view' },
  { to: '/admin/trainers', title: 'Trainers', desc: 'Manage coach profiles and status.', perm: 'trainers:view' },
  { to: '/admin/pricing', title: 'Pricing', desc: 'Update plan pricing and benefits.', perm: 'pricing:view' },
  { to: '/admin/bookings', title: 'Bookings', desc: 'Approve or cancel class requests.', perm: 'bookings:view' },
  { to: '/admin/users', title: 'Users', desc: 'Update roles and manage accounts.', perm: 'users:view' },
  { to: '/admin/roles', title: 'Role Master', desc: 'Define granular CRUD permissions.', perm: 'roles:view' },
  { to: '/admin/trials', title: 'Trial requests', desc: 'Follow up with new leads.', perm: 'trials:view' },
  { to: '/admin/attendance', title: 'Attendance', desc: 'Track and verify member attendance.', perm: 'attendance:view' },
  { to: '/admin/payments', title: 'Payments', desc: 'Monitor transactions and exports.', perm: 'payments:view' },
  { to: '/admin/locations', title: 'Locations', desc: 'Add or remove gym branches.', perm: 'locations:view' },
  { to: '/admin/specialties', title: 'Specialty Master', desc: 'Manage trainer expertise areas.', perm: 'specialties:view' },
  { to: '/admin/reports', title: 'Reports', desc: 'View detailed activity & export Excel.', perm: 'reports:view' }
];

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    memberships: { active: 0 },
    upcomingSessions: 0,
    bookings: { pending: 0 }
  });
  const [loading, setLoading] = useState(true);

  const user = getUser();
  const isAdminOrSuper = user?.role === 'superadmin' || user?.role === 'admin';
  const permissions = user?.permissions || [];

  useEffect(() => {
    api.get('/reports/summary')
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const adminStats = [
    { label: 'Confirmed bookings', value: stats.bookings?.confirmed || 0, to: '/admin/bookings', perm: 'bookings:view' },
    { label: 'Upcoming sessions', value: stats.upcomingSessions || 0, to: '/admin/sessions', perm: 'sessions:view' },
    { label: 'Pending bookings', value: stats.bookings?.pending || 0, to: '/admin/bookings', perm: 'bookings:view' }
  ];

  const filteredActions = adminActions.filter(action => isAdminOrSuper || permissions.includes(action.perm));
  const filteredStats = adminStats.filter(stat => isAdminOrSuper || permissions.includes(stat.perm));

  return (
    <div>
      <Navbar />
      <main className="page-shell pb-12 pt-8">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-ocean to-moss p-8 text-white shadow-glow">
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Admin overview</p>
            <h1 className="mt-3 font-display text-3xl md:text-4xl">Admin dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80">
              Track classes, attendance, payments, and new trial leads from one command center.
            </p>
          </div>
          <div className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 left-10 h-48 w-48 rounded-full bg-white/10" />
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {filteredStats.map((stat) => (
            <Link key={stat.label} to={stat.to} className="soft-card block rounded-2xl p-6 transition-all hover:shadow-md hover:-translate-y-1">
              <p className="text-xs font-bold text-ink/40 uppercase tracking-widest">{stat.label}</p>
              <p className={`mt-3 text-3xl font-black text-ink ${loading ? 'animate-pulse' : ''}`}>
                {loading ? '—' : stat.value}
              </p>
              <div className="mt-4 h-1 w-10 rounded-full bg-brand-blue/70" />
            </Link>
          ))}
        </section>

        <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredActions.map((action) => (
            <Link key={action.to} to={action.to} className="soft-card rounded-3xl p-6 transition hover:-translate-y-1">
              <h3 className="font-display text-lg">{action.title}</h3>
              <p className="mt-2 text-sm text-ink/70">{action.desc}</p>
              <span className="mt-4 inline-flex text-sm font-semibold text-coral">Open </span>
            </Link>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
