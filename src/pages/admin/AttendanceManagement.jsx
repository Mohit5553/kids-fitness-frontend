import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';

const formatSession = (session) => {
  const title = session.classId?.title || 'Class';
  const time = new Date(session.startTime).toLocaleString();
  return `${title} · ${time}`;
};

export default function AttendanceManagement() {
  const [records, setRecords] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [children, setChildren] = useState([]);
  const [form, setForm] = useState({ sessionId: '', childId: '', status: 'present' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadAttendance = () => {
    api.get('/attendance')
      .then((res) => {
        // Sort latest first in case backend didn't (though it should)
        const sorted = (res.data || []).sort((a, b) => new Date(b.checkedInAt) - new Date(a.checkedInAt));
        setRecords(sorted);
      })
      .catch(() => setError('Failed to load attendance logs.'));
  };

  useEffect(() => {
    loadAttendance();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    const end = new Date();
    end.setDate(end.getDate() + 14);

    api.get('/sessions', { params: { start: start.toISOString(), end: end.toISOString() } })
      .then((res) => setSessions(res.data || []))
      .catch(() => setError('Failed to load sessions.'));
  }, []);

  // Filter children by session bookings
  useEffect(() => {
    if (!form.sessionId) {
      setChildren([]);
      return;
    }
    setLoading(true);
    api.get(`/bookings?sessionId=${form.sessionId}`)
      .then((res) => {
        const bookings = res.data || [];
        // Extract children from confirmed bookings
        const allParticipants = bookings
          .filter(b => b.status === 'confirmed')
          .flatMap(b => b.participants);
        
        // Filter those that have a childId ref
        const sessionChildren = allParticipants
          .map(p => p.childId)
          .filter(Boolean);
        
        // Unique children
        const unique = Array.from(new Map(sessionChildren.map(c => [c._id, c])).values());
        setChildren(unique);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch bookings for this session.');
        setLoading(false);
      });
  }, [form.sessionId]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (e.target.name === 'sessionId') {
      setForm(prev => ({ ...prev, childId: '' })); // Reset child when session changes
    }
  };

  const handleCheckin = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    try {
      await api.post('/attendance/checkin', { ...form, method: 'manual' });
      setMessage('Check-in record saved successfully.');
      setForm(prev => ({ ...prev, childId: '', status: 'present' }));
      loadAttendance();
      // Auto clear message
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Check-in failed. This child might already be checked in.');
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
              Manage physical presence for classes. Select a session to see confirmed participants and log their status.
            </p>
          </div>
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 left-40 h-60 w-60 rounded-full bg-sky-400/20 blur-2xl" />
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
                  {loading ? 'Finding Bookings...' : 'Select Participant'}
                </label>
                <select
                  className="w-full rounded-2xl border-none bg-slate-50 p-4 font-bold text-ink focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all disabled:opacity-50"
                  name="childId"
                  value={form.childId}
                  onChange={handleChange}
                  required
                  disabled={!form.sessionId || loading}
                >
                  <option value="">{form.sessionId ? (children.length > 0 ? 'Select a child...' : 'No children found for this session') : 'Select session first'}</option>
                  {children.map((child) => (
                    <option key={child._id} value={child._id}>
                      {child.name} ({child.age} yrs)
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
                  <option value="absent">Excused/Absent</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button 
                className="rounded-2xl bg-brand-blue px-12 py-4 text-sm font-black text-white shadow-xl shadow-brand-blue/20 transition-all hover:scale-105 active:scale-95 disabled:grayscale" 
                type="submit"
                disabled={!form.childId}
              >
                Log Attendance
              </button>
            </div>
          </form>
        </section>

        <section className="mt-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-display text-2xl font-black text-ink">Recent Logs</h2>
            <div className="h-0.5 flex-1 bg-gradient-to-r from-slate-200 to-transparent mx-8 hidden md:block" />
            <p className="text-xs font-bold text-ink/30 uppercase tracking-widest">{records.length} records found</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {records.map((record) => (
              <div 
                key={record._id} 
                className="group relative flex items-center gap-6 rounded-3xl bg-white p-6 shadow-md transition-all hover:shadow-xl border border-transparent hover:border-brand-blue/10 animate-in fade-in slide-in-from-bottom-2"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-bold text-xl ${
                  record.status === 'present' ? 'bg-emerald-100 text-emerald-600' : 
                  record.status === 'late' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                }`}>
                  {record.status[0].toUpperCase()}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-black text-ink">{record.childId?.name || 'Unknown Child'}</p>
                    <span className="text-[10px] font-bold text-ink/20 uppercase tracking-widest">
                       {new Date(record.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-ink/50 leading-relaxed">
                    {record.sessionId?.classId?.title || 'Class'} · {new Date(record.checkedInAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${record.method === 'qr' ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-500'}`}>
                    {record.method || 'manual'}
                  </span>
                </div>
              </div>
            ))}
            {records.length === 0 && (
              <div className="col-span-full py-20 text-center rounded-[3rem] border-4 border-dashed border-slate-100">
                <p className="text-lg font-bold text-ink/20">No attendance logs yet.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

