import { useEffect, useState } from 'react';
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

  const load = () => {
    api.get('/bookings/mine').then((res) => {
      const data = res.data || [];
      setBookings(data);
      setFilteredBookings(data);
    }).catch(() => { });
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
    if (booking.status !== 'confirmed' || booking.refundStatus !== 'none') return false;
    if (!booking.paymentDate) return false;

    const now = new Date();
    const paymentDate = new Date(booking.paymentDate);
    
    // Same day check
    const isSameDay = 
      now.getFullYear() === paymentDate.getFullYear() &&
      now.getMonth() === paymentDate.getMonth() &&
      now.getDate() === paymentDate.getDate();
    
    if (!isSameDay) return false;

    // 1 hour check
    const diffInMs = now.getTime() - paymentDate.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    return diffInHours <= 1;
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

        {message ? <p className="mt-3 text-sm text-moss">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-coral">{error}</p> : null}

        <div className="mt-8 space-y-4">
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <div key={booking._id} className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-black/5 transition hover:shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-lg font-semibold text-ink">{booking.classId?.title}</p>
                      {booking.paymentReference && (
                        <span className="rounded bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-600 uppercase">
                          Ref: {booking.paymentReference}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="flex items-center gap-2 text-xs text-ink/70">
                        <span className="font-medium">Child:</span> {booking.participants?.map(p => p.name).join(', ') || 'N/A'}
                      </p>
                      <p className="flex items-center gap-2 text-xs text-ink/70">
                        <span className="font-medium">Date:</span> {new Date(booking.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {new Date(booking.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-[10px] text-ink/40">ID: {booking._id}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      booking.status === 'confirmed' ? 'bg-moss/10 text-moss' : 
                      booking.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                      'bg-red-100 text-red-600'
                    }`}>
                      {booking.status}
                    </span>

                    {booking.refundStatus && booking.refundStatus !== 'none' && (
                      <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        booking.refundStatus === 'requested' ? 'bg-sky-100 text-sky-700' : 
                        booking.refundStatus === 'refunded' ? 'bg-moss/20 text-moss' : 
                        'bg-red-50 text-red-400'
                      }`}>
                        Refund: {booking.refundStatus}
                      </span>
                    )}
                    
                    {booking.status !== 'confirmed' && booking.status !== 'cancelled' ? (
                      <button
                        className="rounded-full bg-coral px-5 py-2 text-xs font-bold text-white shadow-lg shadow-coral/20 transition hover:scale-105 active:scale-95"
                        onClick={() => openPayment(booking)}
                      >
                        Pay now
                      </button>
                    ) : isRefundable(booking) ? (
                      <button
                        className="rounded-full border border-red-200 bg-red-50 px-5 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 hover:scale-105 active:scale-95"
                        onClick={() => handleRefundRequest(booking._id)}
                      >
                        Request Refund
                      </button>
                    ) : null}
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
            <div className="bg-coral p-6 text-white">
              <h3 className="font-display text-2xl">Complete Payment</h3>
              <p className="mt-1 text-sm text-white/80">Pay for {selectedBooking.classId?.title}</p>
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
                
                <div className="mt-4 flex gap-3">
                  <button 
                    className="flex-1 rounded-full bg-coral py-4 text-sm font-bold text-white shadow-lg shadow-coral/20 transition hover:brightness-110 active:scale-95" 
                    type="submit"
                  >
                    Pay ${selectedBooking.totalAmount || selectedBooking.classId?.price || 0}
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-ink/10 px-8 text-sm font-bold text-ink transition hover:bg-slate-50"
                    onClick={closePayment}
                  >
                    Cancel
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

