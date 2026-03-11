import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    api.get('/payments/mine').then((res) => setPayments(res.data || [])).catch(() => {});
  }, []);

  return (
    <div>
      <Navbar />
      <main className="page-shell py-12">
        <h1 className="font-display text-3xl">Payment History</h1>
        <p className="mt-2 text-sm text-ink/70">Track membership payments and receipts.</p>
        <div className="mt-6 space-y-3">
          {payments.map((payment) => (
            <div key={payment._id} className="rounded-2xl bg-white/80 p-4 shadow-glow">
              <p className="font-semibold">AED {payment.amount}</p>
              <p className="text-xs text-ink/70">Status: {payment.status}</p>
              {payment.planId?.name ? (
                <p className="text-xs text-ink/70">Plan: {payment.planId.name}</p>
              ) : null}
              {payment.bookingId ? (
                <p className="text-xs text-ink/70">Booking: {payment.bookingId}</p>
              ) : null}
              {payment.last4 ? (
                <p className="text-xs text-ink/70">Card ending: {payment.last4}</p>
              ) : null}
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

