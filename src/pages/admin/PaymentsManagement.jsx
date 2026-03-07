import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';

export default function PaymentsManagement() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    api.get('/payments').then((res) => setPayments(res.data || [])).catch(() => {});
  }, []);

  const exportCsv = async () => {
    const res = await api.get('/payments/export/csv', { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'payments.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Navbar />
      <main className="page-shell py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl">Payments</h1>
            <p className="mt-2 text-sm text-ink/70">Monitor payment transactions.</p>
          </div>
          <button className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold" onClick={exportCsv}>
            Export CSV
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {payments.map((payment) => (
            <div key={payment._id} className="rounded-2xl bg-white/80 p-4 shadow-glow">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">AED {payment.amount}</p>
                  <p className="text-xs text-ink/70">User: {payment.userId?.name}</p>
                  {payment.planId?.name ? (
                    <p className="text-xs text-ink/70">Plan: {payment.planId.name}</p>
                  ) : null}
                  {payment.bookingId ? (
                    <p className="text-xs text-ink/70">Booking: {payment.bookingId}</p>
                  ) : null}
                </div>
                <div className="text-xs text-ink/70">
                  {payment.last4 ? <p>Card ending {payment.last4}</p> : null}
                  <p>Status: {payment.status}</p>
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

