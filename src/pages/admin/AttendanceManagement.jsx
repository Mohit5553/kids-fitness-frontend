import { useEffect, useState, useMemo } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';
import { usePermissions } from '../../hooks/usePermissions.js';
import { useSocket } from '../../context/SocketContext.jsx';

const formatSession = (session) => {
  const title = session.classId?.title || 'Class';
  const time = new Date(session.startTime).toLocaleString();
  return `${title} · ${time}`;
};

export default function AttendanceManagement() {
  const [records, setRecords] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [attendees, setAttendees] = useState([]); // Changed name to attendees for clarity
  const [form, setForm] = useState({ sessionId: '', childId: '', participantName: '', status: 'present' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const ITEMS_PER_PAGE = 10;
  const { can } = usePermissions();
  const { socket } = useSocket();

  // Listen for real-time booking updates
  useEffect(() => {
    if (socket) {
      const handleUpdate = () => {
        if (form.sessionId) {
          // Trigger the useEffect that loads attendees by changing a dependency or re-calling
          loadAttendance(); // Also refresh logs
          // For attendees, we just need to re-fetch the bookings for the current session
          api.get(`/bookings?sessionId=${form.sessionId}`)
            .then((res) => {
               // ... redundant logic, but it's better to just use a 'refresh' state
            });
        }
      };
      socket.on('booking_updated', handleUpdate);
      return () => socket.off('booking_updated', handleUpdate);
    }
  }, [socket, form.sessionId]);

  const canCreate = can('attendance:create');

  const loadAttendance = () => {
    setLoading(true);
    api.get('/attendance')
      .then((res) => {
        const sorted = (res.data || []).sort((a, b) => new Date(b.checkedInAt) - new Date(a.checkedInAt));
        setRecords(sorted);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load attendance logs.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAttendance();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    const end = new Date();
    end.setDate(end.getDate() + 14);

    const params = {
      start: start.toISOString(),
      end: end.toISOString(),
      all: true
    };

    api.get('/sessions', { params })
      .then((res) => setSessions(res.data || []))
      .catch(() => setError('Failed to load sessions.'));
  }, []);

  const filteredRecords = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return records.filter(r => 
      !query || 
      r.childId?.name?.toLowerCase().includes(query) ||
      r.participantName?.toLowerCase().includes(query) ||
      r.sessionId?.classId?.title?.toLowerCase().includes(query)
    );
  }, [records, searchQuery]);

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Filter attendees by session bookings
  useEffect(() => {
    if (!form.sessionId) {
      setAttendees([]);
      return;
    }
    setLoading(true);
    api.get(`/bookings?sessionId=${form.sessionId}`)
      .then((res) => {
        const bookings = res.data || [];
        // Show both confirmed and pending bookings (to allow cashier to see them)
        const relevantBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');

        // Extract all participants (profile-linked or name-only)
        const list = [];
        relevantBookings.forEach(b => {
          b.participants.forEach(p => {
            list.push({
              id: p.childId?._id || p._id, // Use childId or participant entry ID
              childId: p.childId?._id || null,
              name: p.name || p.childId?.name || 'Unknown',
              age: p.age || p.childId?.age || '',
              gender: p.gender || p.childId?.gender || '',
              bookingId: b._id,
              status: b.status,
              packageName: b.packageInfo?.name || b.planId?.name || ''
            });
          });
        });

        // Unique by childId (if exists) or Name
        const uniqueItems = [];
        const seen = new Set();
        list.forEach(item => {
          const key = item.childId || item.name;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueItems.push(item);
          }
        });

        setAttendees(uniqueItems);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch bookings for this session.');
        setLoading(false);
      });
  }, [form.sessionId]);

  const handleChange = (e) => {
    if (e.target.name === 'attendeeKey') {
      const selection = attendees.find(a => (a.childId || a.name) === e.target.value);
      if (selection) {
        setForm(prev => ({
          ...prev,
          childId: selection.childId || '',
          participantName: selection.childId ? '' : selection.name,
          bookingId: selection.bookingId
        }));
      } else {
        setForm(prev => ({ ...prev, childId: '', participantName: '', bookingId: '' }));
      }
      return;
    }

    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (e.target.name === 'sessionId') {
      setForm(prev => ({ ...prev, childId: '', participantName: '', bookingId: '' })); // Reset when session changes
    }
  };

  const handleCheckin = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      await api.post('/attendance/checkin', { ...form, method: 'manual' });
      setMessage('Attendance record saved successfully.');
      setForm(prev => ({ ...prev, childId: '', participantName: '', bookingId: '', status: 'present' }));
      loadAttendance();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Check-in failed. This attendee might already be logged.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Navbar />
      <main className="page-shell py-12">
        <header className="relative mb-12 overflow-hidden rounded-[2.5rem] bg-brand-blue p-10 text-white shadow-2xl">
          <div className="relative z-10">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-white/60">Operations</p>
            <h1 className="mt-4 font-display text-4xl font-black">Attendance Tracking</h1>
            <p className="mt-3 max-w-xl text-lg text-white/80 leading-relaxed font-medium">
              Manage physical presence for classes. Select a session to see all attendees (both members and guests).
            </p>
          </div>
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        </header>

        {message && (
          <div className="mb-6 animate-rise rounded-2xl bg-emerald-50 p-4 text-emerald-700 border border-emerald-100 flex items-center gap-3 font-bold text-sm shadow-sm">
            <span className="text-xl">✅</span> {message}
          </div>
        )}

        {error && (
          <div className="mb-6 animate-rise rounded-2xl bg-rose-50 p-4 text-rose-700 border border-rose-100 flex items-center gap-3 font-bold text-sm shadow-sm">
            <span className="text-xl">⚠️</span> {error}
          </div>
        )}

        <section className="soft-card p-1">
          <form className="grid gap-6 rounded-[2rem] bg-white p-8 shadow-xl" onSubmit={handleCheckin}>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-ink/30 ml-4">Select Session</label>
                <select
                  className="w-full rounded-2xl border-none bg-slate-50 p-4 font-bold text-ink focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all"
                  name="sessionId"
                  value={form.sessionId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Choose a class session...</option>
                  {sessions.map((session) => (
                    <option key={session._id} value={session._id}>
                      {formatSession(session)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-ink/30 ml-4">
                  {loading ? 'Finding Attendees...' : 'Select Attendee'}
                </label>
                <select
                  className="w-full rounded-2xl border-none bg-slate-50 p-4 font-bold text-ink focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all disabled:opacity-50"
                  name="attendeeKey"
                  value={form.childId || form.participantName}
                  onChange={handleChange}
                  required
                  disabled={!form.sessionId || loading}
                >
                  <option value="">{form.sessionId ? (attendees.length > 0 ? 'Select a name...' : 'No attendees found for this session') : 'Select session first'}</option>
                  {attendees.map((a) => (
                    <option key={a.id} value={a.childId || a.name}>
                      {a.name} {a.age ? `(${a.age} yrs)` : ''} {a.packageName ? `[📦 ${a.packageName}]` : ''} {a.status === 'pending' ? '⚠️ UNPAID' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-ink/30 ml-4">Attendance Status</label>
                <select
                  className="w-full rounded-2xl border-none bg-slate-50 p-4 font-bold text-ink focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="present">Present</option>
                  <option value="late">Late Arrival</option>
                  <option value="absent">Absent (Eligibility for Extension)</option>
                </select>
              </div>
            </div>

            {canCreate ? (
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  className="rounded-2xl bg-brand-blue px-12 py-4 text-sm font-black text-white shadow-xl shadow-brand-blue/20 transition-all hover:scale-105 active:scale-95 disabled:grayscale"
                  type="submit"
                  disabled={!form.childId && !form.participantName}
                >
                  Log Attendance
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-slate-100 text-center text-xs font-bold text-ink/20 italic">
                You do not have permission to log attendance.
              </div>
            )}
          </form>
        </section>

        <section className="mt-16">
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h2 className="font-display text-2xl font-black text-ink">Recent Logs</h2>
            
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="relative group/search w-full md:w-80">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg grayscale opacity-30 group-focus-within/search:opacity-100 transition-opacity">🔍</span>
                <input 
                  type="text"
                  placeholder="Search logs by student or class..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-slate-200 font-bold text-ink focus:ring-4 focus:ring-brand-blue/5 transition-all outline-none shadow-sm"
                />
              </div>
              <p className="text-xs font-bold text-ink/30 uppercase tracking-widest">{filteredRecords.length} records found</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 text-left">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-24 rounded-3xl bg-white border border-slate-100 animate-pulse p-6 flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
                    <div className="h-3 bg-slate-100 rounded-lg w-3/4" />
                  </div>
                </div>
              ))
            ) : paginatedRecords.map((record) => (
              <div
                key={record._id}
                className="group relative flex items-center gap-6 rounded-3xl bg-white p-6 shadow-md transition-all hover:shadow-xl border border-transparent hover:border-brand-blue/10 animate-in fade-in slide-in-from-bottom-2"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-bold text-xl ${record.status === 'present' ? 'bg-emerald-100 text-emerald-600' :
                  record.status === 'late' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                  }`}>
                  {record.status[0].toUpperCase()}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1 text-left">
                    <p className="text-sm font-black text-ink">{record.childId?.name || record.participantName || 'Guest Participant'}</p>
                    <div className="flex items-center gap-2">
                      {record.bookingId?.status === 'confirmed' && (
                        <button
                          onClick={async () => {
                            try {
                              await api.put(`/bookings/${record.bookingId._id}/status`, { status: 'attended' });
                              loadAttendance();
                            } catch (err) { alert(err.response?.data?.message || 'Failed to verify'); }
                          }}
                          className="text-[9px] font-black text-white bg-sky-500 px-2 py-0.5 rounded-full hover:bg-sky-600 transition-colors uppercase tracking-widest"
                        >
                          Verify Attendance
                        </button>
                      )}
                      {record.bookingId?.status === 'attended' && (
                        <span className="text-[9px] font-black text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full uppercase tracking-widest border border-sky-100">
                          Verified
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-ink/20 uppercase tracking-widest text-right">
                        {new Date(record.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-ink/50 leading-relaxed text-left">
                    {record.sessionId?.classId?.title || 'Class'} · {record.sessionId?.trainerId?.name || 'No Trainer'}
                    {record.bookingId?.packageInfo?.name && ` [📦 ${record.bookingId.packageInfo.name}]`}
                  </p>
                  <p className="text-[10px] font-bold text-ink/30 mt-1">
                    {new Date(record.sessionId?.startTime || record.bookingId?.date || record.checkedInAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-between bg-white/50 border border-slate-100 rounded-[2rem] p-6 shadow-sm">
              <p className="text-[10px] font-black text-ink/30 uppercase tracking-widest">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentPage === 1 ? 'text-ink/20 cursor-not-allowed' : 'bg-white border-2 border-slate-200 text-brand-blue hover:bg-brand-blue hover:text-white hover:border-brand-blue shadow-sm'}`}
                >
                  ← Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentPage === totalPages ? 'text-ink/20 cursor-not-allowed' : 'bg-white border-2 border-slate-200 text-brand-blue hover:bg-brand-blue hover:text-white hover:border-brand-blue shadow-sm'}`}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
