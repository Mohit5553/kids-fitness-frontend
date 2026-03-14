import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cardForm, setCardForm] = useState({ name: '', number: '', expiry: '', cvc: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    api.get('/bookings/mine').then((res) => setBookings(res.data || [])).catch(() => { });
  };

  useEffect(() => {
    load();
  }, []);

  const openPayment = (booking) => {
    setSelectedBooking(booking);
    setCardForm({ name: '', number: '', expiry: '', cvc: '' });
    setMessage('');
    setError('');
  };

  const closePayment = () => {
    setSelectedBooking(null);
  };

  const handleCardChange = (event) => {
    setCardForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handlePay = async (event) => {
    event.preventDefault();
    if (!selectedBooking) return;

    if (!cardForm.name || !cardForm.number || !cardForm.expiry || !cardForm.cvc) {
      setError('Please complete card details.');
      return;
    }

    const last4 = cardForm.number.replace(/\s/g, '').slice(-4);
    const reference = `mock_${Date.now()}`;

    try {
      await api.post('/payments/booking', {
        bookingId: selectedBooking._id,
        paymentMethod: 'card',
        reference,
        last4
      });
      setMessage('Payment successful. Booking confirmed.');
      closePayment();
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Payment failed.');
    }
  };

  return (
    <div>
      <Navbar />
      <main className="page-shell py-12">
        <h1 className="font-display text-3xl">My Bookings</h1>
        <p className="mt-2 text-sm text-ink/70">Pay and manage your class bookings.</p>
        {message ? <p className="mt-3 text-sm text-moss">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-coral">{error}</p> : null}

        <div className="mt-6 space-y-3">
          {bookings.map((booking) => (
            <div key={booking._id} className="rounded-2xl bg-white/80 p-4 shadow-glow">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{booking.classId?.title}</p>
                  <p className="text-xs text-ink/70">Child: {booking.childId?.name}</p>
                  <p className="text-xs text-ink/70">Date: {new Date(booking.date).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-ink/70">{booking.status}</span>
                  {booking.status !== 'confirmed' ? (
                    <button
                      className="rounded-full bg-coral px-3 py-1 text-xs font-semibold text-white"
                      onClick={() => openPayment(booking)}
                    >
                      Pay now
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      {selectedBooking ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-glow">
            <h3 className="font-display text-2xl">Pay for booking</h3>
            <p className="mt-1 text-sm text-ink/70">Test mode only.</p>
            <form className="mt-4 grid gap-3" onSubmit={handlePay}>
              <input
                className="rounded-xl border border-orange-200/70 p-3"
                name="name"
                placeholder="Name on card"
                value={cardForm.name}
                onChange={handleCardChange}
              />
              <input
                className="rounded-xl border border-orange-200/70 p-3"
                name="number"
                placeholder="Card number"
                value={cardForm.number}
                onChange={handleCardChange}
              />
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="rounded-xl border border-orange-200/70 p-3"
                  name="expiry"
                  placeholder="MM/YY"
                  value={cardForm.expiry}
                  onChange={handleCardChange}
                />
                <input
                  className="rounded-xl border border-orange-200/70 p-3"
                  name="cvc"
                  placeholder="CVC"
                  value={cardForm.cvc}
                  onChange={handleCardChange}
                />
              </div>
              <button className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white" type="submit">
                Pay now
              </button>
              <button
                type="button"
                className="rounded-full border border-ink/10 px-5 py-3 text-sm font-semibold text-ink"
                onClick={closePayment}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      ) : null}
      <Footer />
    </div>
  );
}

