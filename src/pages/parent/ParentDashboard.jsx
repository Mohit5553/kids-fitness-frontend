import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';

const quickStats = [
  { label: 'Children registered', value: '—' },
  { label: 'Upcoming classes', value: '—' },
  { label: 'Membership status', value: 'Active' }
];

const actions = [
  { to: '/dashboard/children', title: 'Add child profile', desc: 'Register a new child and set preferences.' },
  { to: '/calendar', title: 'Book from calendar', desc: 'Choose upcoming sessions and reserve seats.' },
  { to: '/dashboard/bookings', title: 'Pay for bookings', desc: 'Complete payments to confirm classes.' },
  { to: '/dashboard/membership', title: 'Manage membership', desc: 'Upgrade or renew a plan.' }
];

export default function ParentDashboard() {
  return (
    <div>
      <Navbar />
      <main className="page-shell pb-12 pt-8">
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
            <div key={stat.label} className="soft-card rounded-2xl p-4">
              <p className="text-xs text-ink/60">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{stat.value}</p>
              <div className="mt-3 h-1 w-10 rounded-full bg-coral/70" />
            </div>
          ))}
        </section>

        <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => (
            <Link key={action.to} to={action.to} className="soft-card rounded-3xl p-6 transition hover:-translate-y-1">
              <h3 className="font-display text-lg">{action.title}</h3>
              <p className="mt-2 text-sm text-ink/70">{action.desc}</p>
              <span className="mt-4 inline-flex text-sm font-semibold text-coral">Open ?</span>
            </Link>
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="soft-card rounded-3xl p-6">
            <h3 className="font-display text-lg">Attendance snapshot</h3>
            <p className="mt-2 text-sm text-ink/70">See check-ins and missed classes at a glance.</p>
            <div className="mt-4 rounded-2xl bg-white/70 p-4 text-sm text-ink/70">
              No attendance recorded yet.
            </div>
          </div>
          <div className="soft-card rounded-3xl p-6">
            <h3 className="font-display text-lg">Payment history</h3>
            <p className="mt-2 text-sm text-ink/70">View receipts and membership renewals.</p>
            <div className="mt-4 rounded-2xl bg-white/70 p-4 text-sm text-ink/70">
              No payments recorded yet.
            </div>
          </div>
          <div className="soft-card rounded-3xl p-6">
            <h3 className="font-display text-lg">Quick links</h3>
            <div className="mt-4 space-y-2 text-sm">
              <Link className="block text-coral" to="/dashboard/children">Manage children ?</Link>
              <Link className="block text-coral" to="/calendar">Book classes ?</Link>
              <Link className="block text-coral" to="/dashboard/bookings">Pay bookings ?</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}


