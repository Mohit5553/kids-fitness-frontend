import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cardForm, setCardForm] = useState({ name: '', number: '', expiry: '', cvc: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/bookings/mine').then((res) => {
      const data = res.data || [];
      setBookings(data);
      setFilteredBookings(data);
      setLoading(false);
    }).catch((err) => {
      setError(err?.response?.data?.message || 'Failed to load bookings. Please check your connection.');
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let result = [...bookings];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.classId?.title?.toLowerCase().includes(q) ||
        b.participants?.some(p => p.name?.toLowerCase().includes(q)) ||
        b.bookingNumber?.toLowerCase().includes(q) ||
        b.paymentReference?.toLowerCase().includes(q) ||
        b._id.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(b => b.status === statusFilter);
    }

    if (dateFilter) {
      result = result.filter(b => new Date(b.date).toISOString().split('T')[0] === dateFilter);
    }

    setFilteredBookings(result);
  }, [searchQuery, statusFilter, dateFilter, bookings]);

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
    let { name, value } = event.target;
    if (name === 'number') {
      value = value.replace(/\D/g, '').slice(0, 16);
      value = value.match(/.{1,4}/g)?.join(' ') || value;
    }
    if (name === 'expiry') {
      value = value.replace(/\D/g, '').slice(0, 4);
      if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
    }
    if (name === 'cvc') {
      value = value.replace(/\D/g, '').slice(0, 4);
    }
    setCardForm((prev) => ({ ...prev, [name]: value }));
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

  const handleRefundRequest = async (bookingId) => {
    if (!window.confirm('Are you sure you want to request a refund?')) return;
    try {
      await api.post(`/bookings/${bookingId}/refund-request`);
      setMessage('Refund request submitted successfully.');
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to request refund.');
    }
  };

  const isRefundable = (booking) => {
    if (booking.refundStatus !== 'none') return false;
    const isPaid = booking.paymentStatus === 'completed' || booking.status === 'confirmed';
    if (!isPaid) return false;

    // Center payments must be completed before they can be refunded
    if (booking.paymentMethod === 'center' && booking.paymentStatus !== 'completed') return false;

    const now = new Date();
    const sessionDate = new Date(booking.date);

    // Allow refund if paid AND session is in the future
    return booking.paymentStatus === 'completed' && now < sessionDate;
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Navbar />
      <main className="page-shell py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-display text-3xl">My Bookings</h1>
            <p className="mt-2 text-sm text-ink/70">Pay and manage your class bookings.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-coral"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-coral"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-coral"
            />
          </div>
        </div>

        {message ? <p className="mt-3 text-sm text-moss font-bold">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-coral font-bold">{error}</p> : null}

        <div className="mt-8 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-3xl bg-white/50 border border-dashed border-ink/10">
              <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-ink/50 font-bold">Loading your bookings...</p>
            </div>
          ) : filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <div key={booking._id} className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-black/5 transition hover:shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-lg font-semibold text-ink">{booking.classId?.title}</p>
                      {booking.bookingNumber && (
                        <span className="rounded bg-brand-blue/10 px-2 py-0.5 text-[10px] font-black text-brand-blue uppercase">
                          {booking.bookingNumber}
                        </span>
                      )}
                      {booking.paymentReference && (
                        <span className="rounded bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-600 uppercase">
                          Ref: {booking.paymentReference}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="flex items-center gap-2 text-xs text-ink/70">
                        <span className="font-medium">Participant(s):</span> {booking.participants?.map(p => `${p.name} (${p.relation || 'N/A'})`).join(', ')}
                      </p>
                      <p className="flex items-center gap-2 text-xs text-ink/70">
                        <span className="font-medium">Date:</span> {new Date(booking.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {new Date(booking.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-[10px] text-ink/40">ID: {booking._id}</p>
                    </div>
                    
                    {['attended', 'completed'].includes(booking.status) && (
                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 animate-in zoom-in-95 duration-500">
                        <span className="text-[10px]">✅</span>
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Attendance Verified</span>
                      </div>
                    )}

                    {/* Cancellation Notice (Only shown for trainer/admin cancellations, hidden if already refunded) */}
                    {booking.status === 'cancelled' && booking.refundStatus !== 'refunded' && booking.cancellationReason && (
                      <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100 animate-in fade-in slide-in-from-top-2 duration-300">
                        <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                          <span>📢</span> Session Status: Cancelled
                        </p>
                        <p className="text-[11px] font-bold text-red-700 leading-relaxed italic">
                          "{booking.cancellationReason}"
                        </p>
                        <p className="mt-2 text-[8px] font-medium text-red-400 uppercase tracking-[0.05em]">
                          Please contact support or check-in at the center for reschedule options.
                        </p>
                      </div>
                    )}

                    {/* Progress Tracker */}
                    <div className="mt-4 flex items-center gap-1">
                      <div className="flex-1 flex flex-col gap-1.5">
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-wider text-ink/30 px-1">
                           <span>Paid</span>
                           <span>Attended</span>
                           <span>Finalized</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden flex">
                           <div className={`h-full transition-all duration-500 ${booking.status !== 'pending' && booking.status !== 'cancelled' ? 'w-1/3 bg-emerald-400' : 'w-0'}`} />
                           <div className={`h-full transition-all duration-500 border-l border-white ${['attended', 'completed'].includes(booking.status) ? 'w-1/3 bg-sky-400' : 'w-0'}`} />
                           <div className={`h-full transition-all duration-500 border-l border-white ${booking.status === 'completed' ? 'w-1/3 bg-indigo-400' : 'w-0'}`} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-50 flex justify-end">
                       <Link 
                          to={`/invoice/booking/${booking._id}`} 
                          className="text-[9px] font-black text-brand-blue uppercase tracking-widest hover:underline flex items-center gap-1.5"
                       >
                          <span>📜</span> View Official Invoice
                       </Link>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        booking.refundStatus === 'refunded' ? 'hidden' : // Hide if refunded
                        booking.status === 'confirmed' ? 'bg-moss/10 text-moss' :
                        booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-600'
                      }`}>
                      {booking.paymentMethod === 'center' && booking.status === 'pending' ? 'Pay at Center' : booking.status}
                    </span>

                    {booking.refundStatus && booking.refundStatus !== 'none' && (
                      <div className="flex flex-col items-end gap-1">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${booking.refundStatus === 'requested' ? 'bg-sky-100 text-sky-700' :
                            booking.refundStatus === 'refunded' ? 'bg-moss/20 text-moss' :
                              'bg-red-50 text-red-400'
                          }`}>
                          Refund: {booking.refundStatus}
                        </span>
                        {booking.refundStatus === 'declined' && booking.refundRejectionReason && (
                          <p className="text-[10px] text-red-500 font-medium max-w-[150px] text-right">
                            Reason: {booking.refundRejectionReason}
                          </p>
                        )}
                      </div>
                    )}

                    {booking.status !== 'confirmed' && booking.status !== 'cancelled' && booking.paymentStatus !== 'completed' && booking.paymentMethod !== 'center' ? (
                      <button
                        className="rounded-full bg-coral px-5 py-2 text-xs font-bold text-white shadow-lg shadow-coral/20 transition hover:scale-105 active:scale-95"
                        onClick={() => openPayment(booking)}
                      >
                        Pay now
                      </button>
                    ) : booking.paymentMethod === 'center' && booking.paymentStatus === 'pending' ? (
                       <p className="text-[10px] font-bold text-ink/30 italic">Please pay at the center front desk</p>
                    ) : isRefundable(booking) ? (
                      <button
                        className="rounded-full border border-red-200 bg-red-50 px-5 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 hover:scale-105 active:scale-95"
                        onClick={() => handleRefundRequest(booking._id)}
                      >
                        Request Refund
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-4">
                     <Link 
                        to={`/invoice/booking/${booking._id}`}
                        className="text-[9px] font-black text-brand-blue/40 uppercase tracking-widest hover:text-brand-blue transition-colors flex items-center gap-1.5"
                     >
                        <span>📜</span> View Invoice
                     </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 rounded-3xl bg-white/50 border border-dashed border-ink/10">
              <p className="text-sm text-ink/50">No bookings found matching your criteria.</p>
              {(searchQuery || statusFilter !== 'all' || dateFilter) && (
                <button
                  onClick={() => { setSearchQuery(''); setStatusFilter('all'); setDateFilter(''); }}
                  className="mt-4 text-xs font-semibold text-coral underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {selectedBooking ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-brand-blue p-8 text-white relative overflow-hidden">
               <div className="relative z-10">
                 <h3 className="font-display text-3xl font-black">Complete Payment</h3>
                 <p className="mt-1 text-sm text-white/80 font-medium italic">Pay for {selectedBooking.classId?.title} • AED {selectedBooking.totalAmount || selectedBooking.classId?.price || 0}</p>
               </div>
               {/* Decorative circle */}
               <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            </div>

            <div className="p-6">
              <div className="mb-6 rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
                <p>This is a secure simulation. No real money will be charged.</p>
              </div>

              <form className="grid gap-4" onSubmit={handlePay}>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-ink/50 px-1">Cardholder Name</label>
                  <input
                    className="w-full rounded-xl border border-ink/10 bg-slate-50 p-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-coral/20 transition"
                    name="name"
                    placeholder="e.g. John Doe"
                    value={cardForm.name}
                    onChange={handleCardChange}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-ink/50 px-1">Card Number</label>
                  <input
                    className="w-full rounded-xl border border-ink/10 bg-slate-50 p-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-coral/20 transition"
                    name="number"
                    placeholder="0000 0000 0000 0000"
                    value={cardForm.number}
                    onChange={handleCardChange}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-ink/50 px-1">Expiry Date</label>
                    <input
                      className="w-full rounded-xl border border-ink/10 bg-slate-50 p-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-coral/20 transition"
                      name="expiry"
                      placeholder="MM/YY"
                      value={cardForm.expiry}
                      onChange={handleCardChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-ink/50 px-1">CVC</label>
                    <input
                      className="w-full rounded-xl border border-ink/10 bg-slate-50 p-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-coral/20 transition"
                      name="cvc"
                      placeholder="123"
                      value={cardForm.cvc}
                      onChange={handleCardChange}
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <button
                    className="w-full rounded-2xl bg-brand-blue py-5 text-sm font-black text-white shadow-xl shadow-brand-blue/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    type="submit"
                  >
                    Pay AED {selectedBooking.totalAmount || selectedBooking.classId?.price || 0}
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-2xl border-2 border-slate-100 py-4 text-[10px] font-black uppercase tracking-widest text-ink/30 transition-all hover:bg-slate-50 hover:text-ink/50"
                    onClick={closePayment}
                  >
                    Cancel Transaction
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
      <Footer />
    </div>
  );
}

