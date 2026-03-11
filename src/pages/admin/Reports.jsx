import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';

export default function Reports() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get('/reports/summary').then((res) => setSummary(res.data)).catch(() => {});
  }, []);

  if (!summary) {
    return (
      <div>
        <Navbar />
        <main className="page-shell py-12">
          <h1 className="font-display text-3xl">Reports</h1>
          <p className="mt-2 text-sm text-ink/70">Loading summary...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <main className="page-shell py-12">
        <h1 className="font-display text-3xl">Reports</h1>
        <p className="mt-2 text-sm text-ink/70">Class attendance, revenue, and retention summaries.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white/80 p-4 shadow-glow">
            <p className="text-xs text-ink/70">Classes</p>
            <p className="text-2xl font-semibold">{summary.classes}</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 shadow-glow">
            <p className="text-xs text-ink/70">Trainers</p>
            <p className="text-2xl font-semibold">{summary.trainers}</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 shadow-glow">
            <p className="text-xs text-ink/70">Upcoming sessions</p>
            <p className="text-2xl font-semibold">{summary.upcomingSessions}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white/80 p-4 shadow-glow">
            <p className="text-xs text-ink/70">Bookings confirmed</p>
            <p className="text-2xl font-semibold">{summary.bookings.confirmed}</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 shadow-glow">
            <p className="text-xs text-ink/70">Bookings pending</p>
            <p className="text-2xl font-semibold">{summary.bookings.pending}</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 shadow-glow">
            <p className="text-xs text-ink/70">Bookings cancelled</p>
            <p className="text-2xl font-semibold">{summary.bookings.cancelled}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white/80 p-4 shadow-glow">
            <p className="text-xs text-ink/70">Members (active)</p>
            <p className="text-2xl font-semibold">{summary.memberships.active}</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 shadow-glow">
            <p className="text-xs text-ink/70">Users total</p>
            <p className="text-2xl font-semibold">{summary.users.total}</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 shadow-glow">
            <p className="text-xs text-ink/70">Revenue (AED)</p>
            <p className="text-2xl font-semibold">{summary.payments.totalAmount}</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

