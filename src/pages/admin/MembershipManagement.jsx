import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';

export default function MembershipManagement() {
  const [memberships, setMemberships] = useState([]);

  const load = () => {
    api.get('/memberships').then((res) => setMemberships(res.data || [])).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, status) => {
    await api.put(`/memberships/${id}`, { status });
    load();
  };

  return (
    <div>
      <Navbar />
      <main className="page-shell py-12">
        <h1 className="font-display text-3xl">Membership Subscriptions</h1>
        <p className="mt-2 text-sm text-ink/70">Monitor active memberships and renewals.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {memberships.map((membership) => (
            <div key={membership._id} className="rounded-2xl bg-white/80 p-4 shadow-glow">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{membership.userId?.name}</p>
                  <p className="text-xs text-ink/70">Plan: {membership.planId?.name}</p>
                  <p className="text-xs text-ink/70">Ends: {membership.endDate ? new Date(membership.endDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <select
                  className="rounded-xl border border-orange-200/70 p-2 text-xs"
                  value={membership.status}
                  onChange={(event) => updateStatus(membership._id, event.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

