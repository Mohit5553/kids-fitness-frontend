import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';

export default function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

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
    
    api.get('/locations?all=true').then(res => setLocations(res.data || [])).catch(() => {});
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

  const updateStatus = async (id, status) => {
    await api.put(`/bookings/${id}/status`, { status });
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this booking?')) return;
    await api.delete(`/bookings/${id}`);
    load();
  };
  
  const resolveRefund = async (id, status) => {
    let reason = '';
    if (status === 'declined') {
      reason = window.prompt('Please enter a reason for rejecting the refund:');
      if (!reason) return;
    } else {
      if (!window.confirm('Are you sure you want to approve this refund?')) return;
    }

    try {
      await api.put(`/bookings/${id}/refund-resolve`, { status, reason });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve refund');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setDateFilter('');
    setLocationFilter('');
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Navbar />
      <main className="page-shell py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="font-display text-4xl font-black text-ink">Booking Management</h1>
            <p className="mt-2 text-sm text-ink/50 font-medium">Manage and monitor all client registrations.</p>
          </div>
          <div className="flex bg-white rounded-2xl p-2 shadow-sm border border-slate-100 italic text-[10px] font-bold text-ink/40 uppercase tracking-widest">
            Total Bookings: {bookings.length}
          </div>
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
                      {booking.participants?.map(p => `${p.name} (${p.relation || 'N/A'})`).join(', ') || 'No Name'}
                    </h3>
                    {booking.bookingNumber ? (
                      <span className="text-[10px] font-black text-brand-blue bg-brand-blue/8 border border-brand-blue/20 px-2.5 py-0.5 rounded-full tracking-widest">
                        #{booking.bookingNumber}
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-ink/20 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">#{booking._id.slice(-6)}</span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <p className="text-xs font-bold text-brand-blue">{booking.classId?.title}</p>
                    {!booking.participants?.some(p => p.relation === 'Self') && (
                      <p className="text-[10px] text-ink/40 font-bold uppercase tracking-widest">
                        Parent: <span className="text-ink/60">{booking.userId?.name || 'Guest'}</span>
                      </p>
                    )}
                    {booking.locationId && (
                       <p className="text-[10px] text-ink/40 font-bold uppercase tracking-widest">
                        📍 {typeof booking.locationId === 'object' ? booking.locationId.name : locations.find(l => l._id === booking.locationId)?.name || 'Central'}
                      </p>
                    )}
                  </div>
                  {booking.sessionId?.startTime && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-brand-blue/30"></span>
                      <p className="text-[11px] font-bold text-ink/50">
                        {new Date(booking.sessionId.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(booking.sessionId.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right flex flex-col items-end gap-2">
                    {booking.refundStatus === 'requested' && (
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest bg-coral px-3 py-1 rounded-full shadow-lg shadow-coral/20 animate-pulse">
                          Refund Requested
                        </span>
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
                    <div>
                      <p className="text-xs font-black text-ink/30 uppercase tracking-widest mb-1 text-right">Status</p>
                      <select
                        className={`rounded-xl border-none p-2.5 text-xs font-bold transition-all outline-none focus:ring-2 ${
                          booking.status === 'confirmed' ? 'bg-moss/10 text-moss focus:ring-moss/20' : 
                          booking.status === 'pending' ? 'bg-amber-100 text-amber-700 focus:ring-amber-200' : 
                          'bg-red-100 text-red-600 focus:ring-red-200'
                        }`}
                        value={booking.status}
                        onChange={(event) => updateStatus(booking._id, event.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  
                  <button
                    className="p-3 rounded-2xl bg-slate-50 text-ink/20 hover:text-red-400 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                    onClick={() => handleDelete(booking._id)}
                    title="Delete Booking"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
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
    </div>
  );
}

