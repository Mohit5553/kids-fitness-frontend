import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';

export default function BookingManagement() {
  const [bookings, setBookings] = useState([]);

  const load = () => {
    api.get('/bookings').then((res) => setBookings(res.data || [])).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, status) => {
    await api.put(`/bookings/${id}/status`, { status });
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this booking?')) return;
    await api.delete(`/bookings/${id}`);
    load();
  };

  return (
    <div>
      <Navbar />
      <main className="page-shell py-12">
        <h1 className="font-display text-3xl">Booking Management</h1>
        <p className="mt-2 text-sm text-ink/70">Approve, reschedule, or cancel bookings.</p>

        <div className="mt-6 space-y-3">
          {bookings.map((booking) => (
            <div key={booking._id} className="rounded-2xl bg-white/80 p-4 shadow-glow">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {booking.childId?.name} · {booking.classId?.title}
                  </p>
                  <p className="text-xs text-ink/70">
                    Parent: {booking.userId?.name} · {new Date(booking.date).toLocaleString()}
                  </p>
                  {booking.sessionId?.startTime ? (
                    <p className="text-xs text-ink/70">
                      Session: {new Date(booking.sessionId.startTime).toLocaleString()}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <select
                    className="rounded-xl border border-orange-200/70 p-2 text-xs"
                    value={booking.status}
                    onChange={(event) => updateStatus(booking._id, event.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button
                    className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold"
                    onClick={() => handleDelete(booking._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

