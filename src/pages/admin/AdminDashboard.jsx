import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar.jsx';
import AdminHeader from '../../components/AdminHeader.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';
import { usePermissions } from '../../hooks/usePermissions.js';

export default function AdminDashboard() {
  const { roleSlug } = useParams();
  const base = `/${roleSlug}`;

  const adminActions = [
    { to: `${base}/walking-booking`, title: 'Walking Booking', desc: 'Book for walk-in customers.', perm: 'bookings:view' },
    { to: `${base}/classes`, title: 'Classes', desc: 'Create and update programs.', perm: 'classes:view' },
    { to: `${base}/sessions`, title: 'Session calendar', desc: 'Schedule classes and copy QR tokens.', perm: 'sessions:view' },
    { to: `${base}/trainers`, title: 'Trainers', desc: 'Manage coach profiles and status.', perm: 'trainers:view' },
    { to: `${base}/pricing`, title: 'Add Membership', desc: 'Update plan pricing and benefits.', perm: 'pricing:view' },
    { to: `${base}/bookings`, title: 'Bookings', desc: 'Approve or cancel class requests.', perm: 'bookings:view' },
    { to: `${base}/users`, title: 'Users', desc: 'Update roles and manage accounts.', perm: 'users:view' },
    { to: `${base}/roles`, title: 'Role Master', desc: 'Define granular CRUD permissions.', perm: 'roles:view' },
    { to: `${base}/promotions`, title: 'Promotions', desc: 'Create and manage discount campaigns.', perm: 'promotions:view' },
    { to: `${base}/trials`, title: 'Trial requests', desc: 'Follow up with new leads.', perm: 'trials:view' },
    { to: `${base}/leads`, title: 'General Inquiries', desc: 'View messages from the contact form.', perm: 'trials:view' },
    { to: `${base}/attendance`, title: 'Attendance', desc: 'Track and verify member attendance.', perm: 'attendance:view' },
    { to: `${base}/payments`, title: 'Payments', desc: 'Monitor transactions and exports.', perm: 'payments:view' },
    { to: `${base}/locations`, title: 'Locations', desc: 'Add or remove gym branches.', perm: 'locations:view' },
    { to: `${base}/specialties`, title: 'Specialty Master', desc: 'Manage trainer expertise areas.', perm: 'specialties:view' },
    { to: `${base}/reports`, title: 'Reports', desc: 'View detailed activity & export Excel.', perm: 'reports:view' },
    { to: `${base}/settings`, title: 'System Setup', desc: 'Configure invoice sequences and global settings.', perm: 'settings:edit' },
    { to: `${base}/taxes`, title: 'Tax Master', desc: 'Manage VAT and local tax rules location-wise.', perm: 'settings:view' },
    { to: `${base}/vouchers`, title: 'Vouchers', desc: 'Generate and print gift or promo vouchers.', perm: 'promotions:view' },
    { to: `${base}/extensions`, title: 'Extension requests', desc: 'Handle missed session reschedule or duration extensions.', perm: 'memberships:view' }
  ];

  const [stats, setStats] = useState({
    memberships: { active: 0 },
    upcomingSessions: 0,
    bookings: { pending: 0 }
  });
  const [loading, setLoading] = useState(true);

  const { can, isAdminOrSuper, user } = usePermissions();
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
    { label: 'Confirmed bookings', value: stats.bookings?.confirmed || 0, to: `${base}/bookings`, perm: 'bookings:view' },
    { label: 'Upcoming sessions', value: stats.upcomingSessions || 0, to: `${base}/sessions`, perm: 'sessions:view' },
    { label: 'Pending bookings', value: stats.bookings?.pending || 0, to: `${base}/bookings`, perm: 'bookings:view' }
  ];

  const filteredActions = adminActions.filter(action => isAdminOrSuper || permissions.includes(action.perm));
  const filteredStats = adminStats.filter(stat => isAdminOrSuper || permissions.includes(stat.perm));

  return (
    <div>
      <Navbar />
      <main className="page-shell pb-12 pt-8">
        <AdminHeader 
          title="Dashboard" 
          description="Track classes, attendance, payments, and new trial leads from one command center."
        />

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
