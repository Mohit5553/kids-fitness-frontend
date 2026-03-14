import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';

const actions = [
  { to: '/dashboard/children', title: 'Add child profile', desc: 'Register a new child and set preferences.' },
  { to: '/calendar', title: 'Book from calendar', desc: 'Choose upcoming sessions and reserve seats.' },
  { to: '/dashboard/bookings', title: 'Pay for bookings', desc: 'Complete payments to confirm classes.' },
  { to: '/dashboard/membership', title: 'Manage membership', desc: 'Upgrade or renew a plan.' }
];

export default function ParentDashboard() {
  const [stats, setStats] = useState({
    childrenCount: 0,
    upcomingClassesCount: 0,
    membershipStatus: 'None'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/parent-summary')
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const quickStats = [
    { label: 'Children registered', value: stats.childrenCount },
    { label: 'Upcoming classes', value: stats.upcomingClassesCount },
    { label: 'Membership status', value: stats.membershipStatus }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="page-shell flex-1 pb-12 pt-8">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-ocean to-coral p-8 text-white shadow-glow">
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Parent dashboard</p>
            <h1 className="mt-3 font-display text-3xl md:text-4xl">Welcome back</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80">
              Manage child profiles, book classes, and track attendance in one place.
            </p>
          </div>
          <div className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 left-10 h-48 w-48 rounded-full bg-white/10" />
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {quickStats.map((stat) => (
            <div key={stat.label} className="soft-card rounded-2xl p-6 transition-all hover:shadow-md">
              <p className="text-xs font-bold text-ink/40 uppercase tracking-widest">{stat.label}</p>
              <p className={`mt-3 text-3xl font-black text-ink ${loading ? 'animate-pulse' : ''}`}>
                {loading ? '—' : stat.value}
              </p>
              <div className="mt-4 h-1 w-10 rounded-full bg-brand-blue/70" />
            </div>
          ))}
        </section>

        <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => (
            <Link key={action.to} to={action.to} className="soft-card rounded-3xl p-6 transition hover:-translate-y-1 group">
              <h3 className="font-display text-lg">{action.title}</h3>
              <p className="mt-2 text-sm text-ink/70">{action.desc}</p>
              <div className="mt-4 flex items-center text-xs font-black uppercase tracking-widest text-brand-blue">
                <span>Manage</span>
                <svg className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="soft-card rounded-3xl p-6">
            <h3 className="font-display text-lg">Attendance snapshot</h3>
            <p className="mt-2 text-sm text-ink/70">See check-ins and missed classes at a glance.</p>
            <div className="mt-4 rounded-2xl bg-slate-50/70 p-4 text-sm text-ink/70 border border-slate-100 italic">
              No attendance recorded yet.
            </div>
          </div>
          <div className="soft-card rounded-3xl p-6">
            <h3 className="font-display text-lg">Payment history</h3>
            <p className="mt-2 text-sm text-ink/70">View receipts and membership renewals.</p>
            <div className="mt-4 rounded-2xl bg-slate-50/70 p-4 text-sm text-ink/70 border border-slate-100 italic">
              No payments recorded yet.
            </div>
          </div>
          <div className="soft-card rounded-3xl p-6">
            <h3 className="font-display text-lg">Quick links</h3>
            <div className="mt-4 space-y-3 text-sm font-bold uppercase tracking-wider">
              <Link className="flex items-center gap-2 text-brand-blue hover:underline" to="/dashboard/children">
                <span>Manage children</span>
                <span className="text-[10px]">?</span>
              </Link>
              <Link className="flex items-center gap-2 text-brand-blue hover:underline" to="/calendar">
                <span>Book classes</span>
                <span className="text-[10px]">?</span>
              </Link>
              <Link className="flex items-center gap-2 text-brand-blue hover:underline" to="/dashboard/bookings">
                <span>Pay bookings</span>
                <span className="text-[10px]">?</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}


