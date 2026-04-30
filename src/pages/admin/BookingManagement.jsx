import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';
import { usePermissions } from '../../hooks/usePermissions.js';
import toast from 'react-hot-toast';

export default function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { can } = usePermissions();
  const { roleSlug } = useParams();

  const canEdit = can('bookings:edit');
  const canDelete = can('bookings:delete');

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingBookingId, setRejectingBookingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [sendingReminderId, setSendingReminderId] = useState(null);

  // Customer Profile Modal (Simplified)
  const [viewingUser, setViewingUser] = useState(null);
  const [viewingHistory, setViewingHistory] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Child Profile Modal
  const [viewingChild, setViewingChild] = useState(null);
  const [viewingChildHistory, setViewingChildHistory] = useState([]);
  const [loadingChildProfile, setLoadingChildProfile] = useState(false);

  // Membership Schedule Modal
  const [viewingMembershipSchedule, setViewingMembershipSchedule] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Booking Details Modal
  const [viewingBookingDetails, setViewingBookingDetails] = useState(null);

  const fetchUserProfile = async (userId) => {
    if (!userId) return;
    setLoadingProfile(true);
    try {
      const [uRes, hRes] = await Promise.all([
        api.get(`/users/${userId}`),
        api.get(`/bookings?userId=${userId}`)
      ]);
      setViewingUser(uRes.data);
      // We only care about the history for trainers
      setViewingHistory(hRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchChildProfile = async (childId) => {
    if (!childId) return;
    setLoadingChildProfile(true);
    try {
      const [cRes, hRes] = await Promise.all([
        api.get(`/children/${childId}`),
        api.get(`/bookings?childId=${childId}`)
      ]);
      setViewingChild(cRes.data);
      setViewingChildHistory(hRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChildProfile(false);
    }
  };

  const fetchMembershipSchedule = async (bookingId) => {
    setLoadingSchedule(true);
    try {
      const res = await api.get(`/memberships/booking/${bookingId}`);
      setViewingMembershipSchedule(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to fetch membership schedule');
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Payment Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmingBookingId, setConfirmingBookingId] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('cash');
  const [paymentRef, setPaymentRef] = useState('');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/bookings').then((res) => {
      setBookings(res.data || []);
      setFilteredBookings(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));

    api.get('/locations?all=true').then(res => setLocations(res.data || [])).catch(() => { });
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let result = [...bookings];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.userId?.name?.toLowerCase().includes(q) ||
        b.participants?.some(p => p.name?.toLowerCase().includes(q)) ||
        b.classId?.title?.toLowerCase().includes(q) ||
        b.planId?.name?.toLowerCase().includes(q) ||
        b._id.toLowerCase().includes(q) ||
        (b.bookingNumber || '').toLowerCase().includes(q)
      );
    }

    if (statusFilter) {
      result = result.filter(b => b.status === statusFilter);
    }

    if (dateFilter) {
      result = result.filter(b => b.sessionId?.startTime?.startsWith(dateFilter));
    }

    if (locationFilter) {
      result = result.filter(b => (b.locationId?._id || b.locationId) === locationFilter);
    }

    setFilteredBookings(result);
  }, [searchQuery, statusFilter, dateFilter, locationFilter, bookings]);

  const isBookingLocked = (booking) => {
    // 1. Lock if status is already 'completed'
    if (booking.status === 'completed') return true;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 2. Differentiate Session vs Package
    // Note: isVirtualMembership represents a specific session check-in, so it behaves like a session
    if (booking.bookingType === 'session' || booking.isVirtualMembership) {
      const bookingDateRaw = booking.date || booking.sessionId?.startTime;
      if (!bookingDateRaw) return false;
      return new Date(bookingDateRaw) < startOfToday;
    } else {
      // Overall Membership Package row
      const isExpired = booking.membershipEndDate && new Date(booking.membershipEndDate) < startOfToday;
      const isUsedUp = (typeof booking.classesRemaining === 'number' && booking.classesRemaining === 0);
      return isExpired || isUsedUp;
    }
  };

  const updateStatus = async (id, status) => {
    await api.put(`/bookings/${id}/status`, { status });
    load();
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This action is non-destructive.')) return;
    try {
      await api.delete(`/bookings/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const confirmCenterPayment = (bookingId) => {
    setConfirmingBookingId(bookingId);
    setSelectedMethod('cash');
    setPaymentRef('');
    setShowConfirmModal(true);
  };

  const performConfirmCenterPayment = async () => {
    setLoading(true);
    try {
      await api.put(`/bookings/${confirmingBookingId}/status`, {
        status: 'confirmed',
        paymentMethod: selectedMethod,
        reference: paymentRef
      });
      setShowConfirmModal(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm payment');
      setLoading(false);
    }
  };

  const resolveRefund = async (id, status) => {
    if (status === 'declined') {
      setRejectionId(id);
      setRejectionReason('');
      setShowRejectModal(true);
      return;
    }

    if (!window.confirm('Are you sure you want to approve this refund?')) return;

    try {
      await api.put(`/bookings/${id}/refund-resolve`, { status });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve refund');
    }
  };

  const submitRejection = async () => {
    if (!rejectionReason.trim()) return alert('Please enter a reason');
    try {
      await api.put(`/bookings/${rejectionId}/refund-resolve`, {
        status: 'declined',
        reason: rejectionReason
      });
      setShowRejectModal(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject refund');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setDateFilter('');
    setLocationFilter('');
  };

  const handleSendReminder = async (booking) => {
    const id = booking._id;
    const isVirtual = booking.isVirtualMembership;
    setSendingReminderId(id);
    try {
      let url = `/bookings/${id}/reminder`;
      if (isVirtual && booking.sessionId?._id) {
        url += `?sessionId=${booking.sessionId._id}`;
      }
      await api.post(url);
      toast.success('Reminder email sent successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reminder');
    } finally {
      setSendingReminderId(null);
    }
  };

  const formatPaymentMethod = (method) => {
    if (!method) return 'N/A';
    if (method.startsWith('center_')) {
      const actualMethod = method.split('_')[1];
      if (actualMethod === 'cash') return 'Pay at Cash';
      return `Pay at Center: ${actualMethod.charAt(0).toUpperCase() + actualMethod.slice(1)}`;
    }
    if (method === 'center') return 'Pay at Center';
    if (method === 'online') return 'Online';
    if (method === 'online_bank') return 'Online Bank Transfer';
    return method.charAt(0).toUpperCase() + method.slice(1);
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Navbar />
      <main className="page-shell py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="font-display text-4xl font-black text-ink">Booking Management</h1>
            <p className="mt-2 text-sm text-ink/50 font-medium">Manage and monitor all client registrations.</p>
          </div>
          <Link
            to={`/${roleSlug}/corporate-booking`}
            className="bg-brand-blue text-white px-6 py-4 rounded-2xl font-black shadow-xl shadow-brand-blue/20 hover:scale-[1.02] transition-all flex items-center gap-3"
          >
            <span className="text-xl">🏢</span> New Corporate Booking
          </Link>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            label="Total"
            value={bookings.length}
            icon="📊"
            color="slate"
            loading={loading}
          />
          <StatCard
            label="Pending"
            value={bookings.filter(b => b.status === 'pending').length}
            icon="⏳"
            color="amber"
            loading={loading}
          />
          <StatCard
            label="Packages"
            value={bookings.filter(b => b.bookingType === 'package').length}
            icon="📦"
            color="indigo"
            loading={loading}
          />
          <StatCard
            label="Confirmed"
            value={bookings.filter(b => b.status === 'confirmed' || b.status === 'attended' || b.status === 'completed').length}
            icon="✅"
            color="emerald"
            loading={loading}
          />
          <StatCard
            label="Refunds"
            value={bookings.filter(b => b.refundStatus === 'requested').length}
            icon="💰"
            color="coral"
            loading={loading}
          />
        </div>

        {/* Filters Section */}
        <div className="soft-card rounded-[32px] p-6 mb-8 bg-white/80 backdrop-blur-xl border border-white/50 shadow-glow">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-ink/30 uppercase tracking-[0.2em] mb-2 px-2">Search</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Booking No., Name, Class, or ID…"
                  className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-8 pr-4 text-xs font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all placeholder:text-ink/20"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-ink/30 uppercase tracking-[0.2em] mb-2 px-2">Status</label>
              <select
                className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-xs font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="attended">Attended</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-ink/30 uppercase tracking-[0.2em] mb-2 px-2">Location</label>
              <select
                className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-xs font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
                value={locationFilter}
                onChange={e => setLocationFilter(e.target.value)}
              >
                <option value="">All Branches</option>
                {locations.map(loc => (
                  <option key={loc._id} value={loc._id}>{loc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-ink/30 uppercase tracking-[0.2em] mb-2 px-2">Date</label>
              <input
                type="date"
                className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-xs font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
              />
            </div>
          </div>

          {(searchQuery || statusFilter || dateFilter || locationFilter) && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-[10px] font-black text-coral uppercase tracking-widest hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {loading ? (
            Array(3).fill(0).map((_, i) => <div key={i} className="h-24 animate-pulse bg-white/50 rounded-3xl" />)
          ) : filteredBookings.length > 0 ? filteredBookings.map((booking) => (
            <div key={booking._id} className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:translate-y-[-2px]">
              <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-display text-xl font-bold text-ink leading-tight">
                      {booking.participants?.map((p, idx) => (
                        <span key={idx}>
                          <span className="text-ink font-bold">{p.name}</span>
                          {` (${p.relation || 'N/A'})${idx < (booking.participants.length - 1) ? ', ' : ''}`}
                        </span>
                      )) || 'No Name'}
                    </h3>
                    {booking.bookingNumber ? (
                      <span className="text-[10px] font-black text-brand-blue bg-brand-blue/8 border border-brand-blue/20 px-2.5 py-0.5 rounded-full tracking-widest">
                        #{booking.bookingNumber}
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-ink/20 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">#{booking._id.slice(-6)}</span>
                    )}
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full tracking-widest">
                      📅 {new Date(booking.sessionId?.startTime || booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {booking.bookingType === 'package' && (
                      <span className="text-[10px] font-black text-white bg-indigo-600 px-2.5 py-0.5 rounded-full tracking-widest animate-pulse">
                        📦 Package Purchase
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <p className="text-xs font-bold text-brand-blue">
                      {booking.bookingType === 'package' ? `Membership: ${booking.planId?.name || 'Package'}` : booking.classId?.title}
                    </p>
                    {!booking.participants?.some(p => p.relation === 'Self') && (
                      <p className="text-[10px] text-ink/40 font-bold uppercase tracking-widest">
                        Parent: <span className="text-brand-blue">{booking.userId?.name || 'Guest'}</span>
                      </p>
                    )}
                    {booking.locationId && (
                      <p className="text-[10px] text-ink/40 font-bold uppercase tracking-widest">
                        📍 {typeof booking.locationId === 'object' ? booking.locationId.name : locations.find(l => l._id === booking.locationId)?.name || 'Central'}
                      </p>
                    )}
                    <p className="text-[10px] text-brand-blue font-bold uppercase tracking-widest">
                      💳 {formatPaymentMethod(booking.paymentMethod)}
                    </p>
                    {booking.processedByRole ? (
                      <p className="text-[10px] text-brand-blue/50 font-bold uppercase tracking-widest flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-brand-blue/30"></span>
                        Source: <span className="text-brand-blue">Walking</span> ({booking.processedBy?.name || booking.processedByRole})
                      </p>
                    ) : (
                      <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-indigo-200"></span>
                        Source: Website / Parent
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-4">
                      <Link
                        to={`/invoice/booking/${booking._id}`}
                        className="text-[9px] font-black text-brand-blue/40 uppercase tracking-widest hover:text-brand-blue transition-colors flex items-center gap-1.5"
                      >
                        <span>📜</span> View & Print Invoice
                      </Link>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={() => setViewingBookingDetails(booking)}
                      className="px-5 py-2.5 bg-slate-50 text-brand-blue text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-blue hover:text-white transition-all border border-slate-100 shadow-sm flex items-center gap-2 group"
                    >
                      <span className="group-hover:scale-110 transition-transform">🔍</span> 
                      <span>View Full Details</span>
                    </button>
                    {booking.sessionId?.startTime && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-50">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse"></span>
                        <p className="text-[10px] font-bold text-ink/50 uppercase tracking-tight">
                          {new Date(booking.sessionId.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {new Date(booking.sessionId.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right flex flex-col items-end gap-2">
                    {canEdit && booking.paymentMethod === 'center' && booking.paymentStatus === 'pending' && booking.status !== 'cancelled' && (
                      <button
                        onClick={() => confirmCenterPayment(booking._id)}
                        className="mb-2 bg-brand-blue text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-lg shadow-brand-blue/20 hover:scale-[1.05] transition-all flex items-center gap-2"
                      >
                        <span className="text-sm">💵</span> Confirm Center Payment
                      </button>
                    )}
                    {booking.refundStatus === 'requested' && (
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest bg-coral px-3 py-1 rounded-full shadow-lg shadow-coral/20 animate-pulse">
                          Refund Requested
                        </span>
                        {canEdit && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => resolveRefund(booking._id, 'refunded')}
                              className="bg-moss/10 text-moss text-[10px] font-bold px-3 py-1 rounded-lg hover:bg-moss/20 transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => resolveRefund(booking._id, 'declined')}
                              className="bg-red-50 text-red-600 text-[10px] font-bold px-3 py-1 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {booking.refundStatus === 'declined' && (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                          Refund Rejected
                        </span>
                        {booking.refundRejectionReason && (
                          <p className="text-[9px] text-ink/40 font-medium max-w-[150px] text-right truncate" title={booking.refundRejectionReason}>
                            Reason: {booking.refundRejectionReason}
                          </p>
                        )}
                      </div>
                    )}
                    {booking.refundStatus === 'refunded' && (
                      <span className="text-[10px] font-black text-moss uppercase tracking-widest bg-moss/10 px-2 py-0.5 rounded-full border border-moss/20">
                        Refunded
                      </span>
                    )}
                    {booking.status !== 'cancelled' && (
                      <button
                        onClick={() => handleSendReminder(booking)}
                        disabled={sendingReminderId === booking._id}
                        className="mb-2 text-[9px] font-black uppercase tracking-widest text-brand-blue hover:text-brand-blue/70 flex items-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        {sendingReminderId === booking._id ? (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                        )}
                        {sendingReminderId === booking._id ? 'Sending...' : 'Send Reminder'}
                      </button>
                    )}
                    <div>
                      <p className="text-xs font-black text-ink/30 uppercase tracking-widest mb-1 text-right flex items-center justify-end gap-1">
                        {isBookingLocked(booking) && <span title="Status Locked">🔒</span>}
                        Status
                      </p>
                      {canEdit ? (
                        <select
                          disabled={isBookingLocked(booking)}
                          className={`rounded-xl border-none p-2.5 text-xs font-bold transition-all outline-none focus:ring-2 ${booking.status === 'completed' ? 'bg-indigo-100 text-indigo-700 focus:ring-indigo-200' :
                            booking.status === 'attended' ? 'bg-sky-100 text-sky-700 focus:ring-sky-200' :
                              booking.status === 'confirmed' ? 'bg-moss/10 text-moss focus:ring-moss/20' :
                                booking.status === 'pending' ? 'bg-amber-100 text-amber-700 focus:ring-amber-200' :
                                  'bg-red-100 text-red-600 focus:ring-red-200'
                            }`}
                          value={booking.status}
                          onChange={(event) => {
                            const newStatus = event.target.value;
                            // If confirming a center booking that is still pending payment, show the modal
                            if (newStatus === 'confirmed' && booking.paymentMethod === 'center' && booking.paymentStatus === 'pending') {
                              confirmCenterPayment(booking._id);
                            } else {
                              updateStatus(booking._id, newStatus);
                            }
                          }}
                        >
                          <option value="pending" disabled={booking.status !== 'pending'}>Pending</option>
                          <option value="confirmed" disabled={['attended', 'completed'].includes(booking.status)}>Confirmed</option>
                          <option value="attended" disabled={booking.status === 'completed'}>Attended</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled" disabled={['attended', 'completed'].includes(booking.status)}>Cancelled</option>
                        </select>
                      ) : (
                        <span className={`inline-block rounded-xl px-3 py-1.5 text-xs font-bold ${booking.status === 'confirmed' ? 'bg-moss/10 text-moss' :
                          booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-600'
                          }`}>
                          {booking.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {canDelete && booking.status !== 'cancelled' && (
                    <button
                      className="p-3 rounded-2xl bg-slate-50 text-ink/20 hover:text-red-400 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                      onClick={() => handleCancelBooking(booking._id)}
                      title="Cancel Booking"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="py-20 text-center soft-card rounded-[32px] bg-white border border-dashed border-slate-200">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="font-display text-xl text-ink/60">No bookings found</h3>
              <p className="text-sm text-ink/30 mt-1">Try adjusting your filters or search query.</p>
              <button onClick={clearFilters} className="mt-6 text-xs font-black text-brand-blue uppercase tracking-widest hover:underline">Clear all filters</button>
            </div>
          )}
        </div>
      </main>
      <Footer />

      <PaymentModal
        show={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={performConfirmCenterPayment}
        method={selectedMethod}
        setMethod={setSelectedMethod}
        reference={paymentRef}
        setReference={setPaymentRef}
        confirmingBookingId={confirmingBookingId}
        bookings={bookings}
      />

      {/* Booking Details Modal */}
      {viewingBookingDetails && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-600 p-8 text-white flex justify-between items-start shrink-0 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black bg-white/20 px-2 py-1 rounded-lg uppercase tracking-widest">Booking Record</span>
                  {viewingBookingDetails.bookingNumber && (
                    <span className="text-[10px] font-black bg-white text-indigo-600 px-2 py-1 rounded-lg uppercase tracking-widest">{viewingBookingDetails.bookingNumber}</span>
                  )}
                </div>
                <h3 className="font-display text-3xl font-black text-white">Full Details</h3>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">ID: {viewingBookingDetails._id}</p>
              </div>
              <button onClick={() => setViewingBookingDetails(null)} className="relative z-10 rounded-full bg-white/10 p-2 hover:bg-white/20 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              {/* Decorative circle */}
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50">
              {/* Core Info */}
              <div className="grid md:grid-cols-2 gap-8">
                <section>
                  <h4 className="text-[10px] font-black text-ink uppercase tracking-[0.2em] mb-4">Service Information</h4>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div>
                      <p className="text-[9px] font-black text-ink/20 uppercase tracking-widest mb-1">Type</p>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${viewingBookingDetails.bookingType === 'package' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500'}`}>
                        {viewingBookingDetails.bookingType === 'package' ? '📦 Membership / Package' : '🎟️ Single Session'}
                      </span>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-ink/20 uppercase tracking-widest mb-1">Service Name</p>
                      <p className="text-sm font-black text-ink">{viewingBookingDetails.classId?.title || viewingBookingDetails.planId?.name || 'Package Purchase'}</p>
                      {viewingBookingDetails.bookingType === 'package' && (
                        <button
                          onClick={() => fetchMembershipSchedule(viewingBookingDetails._id)}
                          className="mt-2 text-[10px] font-black text-brand-blue uppercase tracking-widest hover:underline flex items-center gap-1.5"
                        >
                          <span>📅</span> View Schedule →
                        </button>
                      )}
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-ink/20 uppercase tracking-widest mb-1">Booking Date</p>
                      <p className="text-sm font-black text-ink">{new Date(viewingBookingDetails.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-[10px] font-black text-ink uppercase tracking-[0.2em] mb-4">Payment & Finance</h4>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[9px] font-black text-ink/20 uppercase tracking-widest">Total Amount</p>
                        <p className="text-lg font-black text-brand-blue">AED {viewingBookingDetails.totalAmount?.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-ink/20 uppercase tracking-widest">Status</p>
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${viewingBookingDetails.paymentStatus === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {viewingBookingDetails.paymentStatus}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                      <div>
                        <p className="text-[9px] font-black text-ink/20 uppercase tracking-widest">Method</p>
                        <p className="text-[11px] font-bold text-ink">{viewingBookingDetails.paymentMethod?.toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-ink/20 uppercase tracking-widest">Reference</p>
                        <p className="text-[11px] font-bold text-ink truncate">{viewingBookingDetails.paymentReference || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Participants */}
              <section>
                <h4 className="text-[10px] font-black text-ink uppercase tracking-[0.2em] mb-4">Participants ({viewingBookingDetails.participants?.length})</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  {viewingBookingDetails.participants?.map((p, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg">👤</div>
                      <div>
                        <p className="text-sm font-black text-ink">{p.name}</p>
                        <p className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">{p.relation || 'N/A'} • {p.age} Years</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Advanced Tracking / Lifecycle */}
              <section>
                <h4 className="text-[10px] font-black text-ink uppercase tracking-[0.2em] mb-4">Activity Tracking</h4>
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-50">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-[10px]">✨</div>
                      <div>
                        <p className="text-[11px] font-bold text-ink">Source</p>
                        <p className="text-[10px] text-ink/40 font-medium">Where the booking originated</p>
                      </div>
                    </div>
                    <p className="text-[11px] font-black text-indigo-600 uppercase">
                      {viewingBookingDetails.processedByRole ? `Walking (${viewingBookingDetails.processedByRole})` : 'Website / Parent'}
                    </p>
                  </div>
                  {viewingBookingDetails.lifecycle?.paidAt && (
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-[10px]">💵</div>
                        <div>
                          <p className="text-[11px] font-bold text-ink">Paid At</p>
                          <p className="text-[10px] text-ink/40 font-medium">Payment verification timestamp</p>
                        </div>
                      </div>
                      <p className="text-[11px] font-black text-emerald-600">{new Date(viewingBookingDetails.lifecycle.paidAt).toLocaleString()}</p>
                    </div>
                  )}
                  {viewingBookingDetails.lifecycle?.attendedAt && (
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-[10px]">✅</div>
                        <div>
                          <p className="text-[11px] font-bold text-ink">Attended At</p>
                          <p className="text-[10px] text-ink/40 font-medium">Session attendance verification</p>
                        </div>
                      </div>
                      <p className="text-[11px] font-black text-sky-600">{new Date(viewingBookingDetails.lifecycle.attendedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Reason (Cancellation/Refund) */}
              {(viewingBookingDetails.status === 'cancelled' || viewingBookingDetails.cancellationReason) && (
                <section className="bg-red-50 p-6 rounded-3xl border border-red-100">
                  <h4 className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                    <span>🚫</span> Cancellation Details
                  </h4>
                  <p className="text-sm font-bold text-red-800 italic">"{viewingBookingDetails.cancellationReason || 'No reason provided.'}"</p>
                </section>
              )}
            </div>

            <div className="p-8 border-t border-slate-100 bg-white flex justify-end gap-4 shrink-0">
              <Link
                to={`/invoice/booking/${viewingBookingDetails._id}`}
                className="px-8 py-4 rounded-2xl bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2"
              >
                <span>📜</span> Print Invoice
              </Link>
              <button onClick={() => setViewingBookingDetails(null)} className="px-10 py-4 rounded-2xl bg-slate-50 text-ink/40 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="font-display text-2xl font-black text-ink mb-2">Reject Refund</h2>
            <p className="text-sm text-ink/40 font-medium mb-6">Please provide a reason for declining this refund request.</p>

            <textarea
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold text-ink focus:border-brand-blue/20 focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all min-h-[120px] resize-none"
              placeholder="e.g. Booking date has already passed..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              autoFocus
            />

            <div className="flex items-center gap-3 mt-8">
              <button
                onClick={submitRejection}
                className="flex-1 bg-coral text-white py-4 rounded-2xl font-black shadow-lg shadow-coral/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 bg-slate-50 text-ink/40 py-4 rounded-2xl font-black hover:bg-slate-100 transition-all text-sm uppercase tracking-widest"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER PROFILE MODAL (Simplified) */}
      {viewingUser && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-ink p-8 text-white flex justify-between items-start shrink-0">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Customer Profile</p>
                <h3 className="font-display text-3xl font-black text-white">{viewingUser.name}</h3>
                <p className="text-sm font-bold text-white/70 mt-1">{viewingUser.email}</p>
                <p className="text-sm font-bold text-white/70">{viewingUser.phone || 'No Phone'}</p>
              </div>
              <button onClick={() => setViewingUser(null)} className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50 relative">
              {loadingProfile && (
                <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-[4px] border-brand-blue border-t-transparent" />
                </div>
              )}

              <section>
                <h4 className="text-[10px] font-black text-ink uppercase tracking-[0.2em] mb-4">Assigned Trainers</h4>
                <div className="space-y-3">
                  {Array.from(new Set(viewingHistory.map(b => b.sessionId?.trainerId?.name).filter(Boolean))).map((trainerName, idx) => (
                    <div key={idx} className="bg-white px-5 py-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-sm">👤</div>
                      <p className="text-sm font-black text-ink">{trainerName}</p>
                    </div>
                  ))}
                  {viewingHistory.every(b => !b.sessionId?.trainerId?.name) && <p className="text-xs text-ink/20 font-bold italic">No trainers assigned yet.</p>}
                </div>
              </section>
            </div>

            <div className="p-6 border-t border-slate-100 bg-white text-center shrink-0">
              <button onClick={() => setViewingUser(null)} className="w-full py-4 rounded-2xl bg-brand-blue text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-blue/20">
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHILD PROFILE MODAL */}
      {/* MEMBERSHIP SCHEDULE MODAL (Nested) */}
      {viewingMembershipSchedule && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] w-full max-w-xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-900 p-8 text-white flex justify-between items-start shrink-0">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Membership Schedule</p>
                <h3 className="font-display text-2xl font-black text-white">{viewingMembershipSchedule.planId?.name}</h3>
                <p className="text-xs font-bold text-white/50 mt-1">
                  Valid: {new Date(viewingMembershipSchedule.startDate).toLocaleDateString()} — {new Date(viewingMembershipSchedule.endDate).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => setViewingMembershipSchedule(null)} className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-slate-50/50">
              {viewingMembershipSchedule.generatedSessions?.length > 0 ? (
                viewingMembershipSchedule.generatedSessions.map((session, sidx) => (
                  <div key={session._id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                        {sidx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-black text-ink">
                          {new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">
                            {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                          <span className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">
                            Trainer: {session.trainerId?.name || 'TBA'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${session.status === 'scheduled' ? 'bg-indigo-50 text-indigo-600' :
                      session.status === 'present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        session.status === 'absent' ? 'bg-red-50 text-red-500 border border-red-100' :
                          'bg-slate-100 text-slate-400'
                      }`}>
                      {session.status === 'present' ? '✓ Present' :
                        session.status === 'absent' ? '✖ Absent' :
                          session.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-ink/20">
                  <p className="text-sm font-bold">No sessions found for this membership.</p>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-slate-100 bg-white flex justify-end shrink-0">
              <button onClick={() => setViewingMembershipSchedule(null)} className="px-8 py-3 rounded-2xl bg-slate-50 text-ink/40 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                Close Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {loadingSchedule && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/5 backdrop-blur-[1px]">
          <div className="h-12 w-12 animate-spin rounded-full border-[4px] border-brand-blue border-t-transparent shadow-xl" />
        </div>
      )}

      {viewingChild && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-brand-blue p-8 text-white flex justify-between items-start shrink-0">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Participant Profile</p>
                <h3 className="font-display text-3xl font-black text-white">{viewingChild.name}</h3>
                <div className="flex gap-3 mt-2">
                  <span className="text-[10px] font-black bg-white/20 px-2 py-1 rounded-lg uppercase tracking-widest">{viewingChild.age} Years Old</span>
                  <span className="text-[10px] font-black bg-white/20 px-2 py-1 rounded-lg uppercase tracking-widest">{viewingChild.gender}</span>
                </div>
              </div>
              <button onClick={() => setViewingChild(null)} className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50 relative">
              {loadingChildProfile && (
                <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-[4px] border-brand-blue border-t-transparent" />
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-8">
                <section>
                  <h4 className="text-[10px] font-black text-ink uppercase tracking-[0.2em] mb-4">Parent Information</h4>
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-sm font-black text-ink">{viewingChild.parentId?.name}</p>
                    <p className="text-xs font-bold text-ink/40 mt-1">{viewingChild.parentId?.phone || 'No phone'}</p>
                    <button
                      onClick={() => { setViewingChild(null); fetchUserProfile(viewingChild.parentId?._id); }}
                      className="mt-4 text-[9px] font-black text-brand-blue uppercase tracking-widest hover:underline"
                    >
                      View Parent Details →
                    </button>
                  </div>
                </section>

                <section>
                  <h4 className="text-[10px] font-black text-ink uppercase tracking-[0.2em] mb-4">Participant Details</h4>
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div>
                      <p className="text-[9px] font-black text-ink/20 uppercase tracking-widest">Medical Condition</p>
                      <p className="text-xs font-bold text-ink mt-1">{viewingChild.medicalCondition || 'None reported'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-ink/20 uppercase tracking-widest">School</p>
                      <p className="text-xs font-bold text-ink mt-1">{viewingChild.school || 'Not specified'}</p>
                    </div>
                  </div>
                </section>
              </div>

              <section>
                <h4 className="text-[10px] font-black text-ink uppercase tracking-[0.2em] mb-4">Booking History ({viewingChildHistory.length})</h4>
                <div className="space-y-3">
                  {viewingChildHistory.map(b => (
                    <div key={b._id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm ${b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                          {b.status === 'attended' ? '✓' : b.bookingType === 'package' ? '📦' : '📅'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-ink truncate leading-tight">
                            {b.bookingType === 'package' ? `Membership: ${b.planId?.name}` : b.classId?.title}
                          </p>
                          <p className="text-[10px] font-bold text-ink/30 uppercase tracking-widest mt-1">
                            {new Date(b.sessionId?.startTime || b.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · {b.sessionId?.trainerId?.name || 'Assigned Trainer'}
                          </p>
                          {b.bookingType === 'package' && (
                            <button
                              onClick={() => fetchMembershipSchedule(b._id)}
                              className="mt-2 text-[10px] font-black text-brand-blue uppercase tracking-widest hover:underline flex items-center gap-1.5"
                            >
                              <span>📅</span> View Schedule →
                            </button>
                          )}
                        </div>
                      </div>
                      <span className={`shrink-0 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                        b.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                  {viewingChildHistory.length === 0 && <p className="text-xs text-ink/20 font-bold italic">No bookings found for this participant.</p>}
                </div>
              </section>
            </div>

            <div className="p-8 border-t border-slate-100 bg-white flex justify-end shrink-0">
              <button onClick={() => setViewingChild(null)} className="px-10 py-4 rounded-2xl bg-slate-50 text-ink/40 text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Statistics Card Component
const StatCard = ({ label, value, icon, color, loading }) => {
  const colors = {
    slate: 'bg-slate-50 text-slate-600 border-slate-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    coral: 'bg-coral/5 text-coral border-coral/10'
  };

  return (
    <div className={`soft-card rounded-[32px] p-5 flex flex-col items-center justify-center text-center transition-all hover:shadow-md border bg-white ${loading ? 'animate-pulse opacity-60' : ''}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-3 ${colors[color] || colors.slate} border`}>
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-ink/30 mb-1">{label}</p>
      <p className="text-2xl font-black text-ink">
        {loading ? '—' : value}
      </p>
    </div>
  );
};

// Payment Confirmation Modal Component
const PaymentModal = ({ show, onClose, onConfirm, method, setMethod, reference, setReference, confirmingBookingId, bookings }) => {
  if (!show) return null;

  const methods = [
    { id: 'cash', label: 'Cash', icon: '💵' },
    { id: 'card', label: 'Card / POS', icon: '💳' },
    { id: 'online', label: 'Manual Online Transfer', icon: '🌐' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-blue/10 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">💰</div>
          <h2 className="font-display text-2xl font-black text-ink">Confirm Payment</h2>
          <p className="text-sm text-ink/40 font-medium mt-2">How was the payment received at the center?</p>
          {show && confirmingBookingId && (
            <div className="mt-4 inline-block px-4 py-2 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold">
              Session Date: {new Date(bookings.find(b => b._id === confirmingBookingId)?.sessionId?.startTime || bookings.find(b => b._id === confirmingBookingId)?.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          )}
        </div>

        <div className="space-y-3 mb-8">
          {methods.map(m => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${method === m.id ? 'border-brand-blue bg-brand-blue/5 text-brand-blue' : 'border-slate-100 bg-white hover:border-brand-blue/20'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{m.icon}</span>
                <span className="text-sm font-bold">{m.label}</span>
              </div>
              {method === m.id && (
                <div className="w-5 h-5 bg-brand-blue text-white rounded-full flex items-center justify-center text-[10px]">✓</div>
              )}
            </button>
          ))}
        </div>

        <div className="mb-8">
          <label className="block text-[10px] font-black text-ink/30 uppercase tracking-[0.2em] mb-2 px-2">
            {method === 'cash' ? 'Optional Reference / Note' : 'Transaction Number / Code (Required)'}
          </label>
          <input
            type="text"
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 text-xs font-bold text-ink focus:border-brand-blue/20 outline-none transition-all"
            placeholder={method === 'cash' ? 'e.g. Received at reception' : 'Enter Transaction ID or Auth Code...'}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full bg-brand-blue text-white py-4 rounded-2xl font-black shadow-lg shadow-brand-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Confirm & Complete Booking
          </button>
          <button
            onClick={onClose}
            className="w-full bg-white text-ink/40 py-4 rounded-2xl font-black hover:bg-slate-50 transition-all text-xs uppercase tracking-widest"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

