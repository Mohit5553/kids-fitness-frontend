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

  const load = () => {
    api.get('/attendance').then((res) => setRecords(res.data || [])).catch(() => {});
  };

  useEffect(() => {
    load();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    const end = new Date();
    end.setDate(end.getDate() + 14);

    api
      .get('/sessions', { params: { start: start.toISOString(), end: end.toISOString() } })
      .then((res) => setSessions(res.data || []))
      .catch(() => {});

    api.get('/children').then((res) => setChildren(res.data || [])).catch(() => {});
  }, []);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleCheckin = async (event) => {
    event.preventDefault();
    await api.post('/attendance/checkin', { ...form, method: 'manual' });
    setForm({ sessionId: '', childId: '', status: 'present' });
    load();
  };

  return (
    <div>
      <Navbar />
      <main className="page-shell py-12">
        <h1 className="font-display text-3xl">Attendance Tracking</h1>
        <p className="mt-2 text-sm text-ink/70">Manual check-ins and attendance logs.</p>

        <form className="mt-6 grid gap-3 rounded-3xl bg-white/80 p-6 shadow-glow" onSubmit={handleCheckin}>
          <div className="grid gap-3 md:grid-cols-3">
            <select
              className="rounded-xl border border-orange-200/70 p-3"
              name="sessionId"
              value={form.sessionId}
              onChange={handleChange}
              required
            >
              <option value="">Select session</option>
              {sessions.map((session) => (
                <option key={session._id} value={session._id}>
                  {formatSession(session)}
                </option>
              ))}
            </select>
            <select
              className="rounded-xl border border-orange-200/70 p-3"
              name="childId"
              value={form.childId}
              onChange={handleChange}
              required
            >
              <option value="">Select child</option>
              {children.map((child) => (
                <option key={child._id} value={child._id}>
                  {child.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-xl border border-orange-200/70 p-3"
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
            </select>
          </div>
          <button className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white" type="submit">
            Check-in
          </button>
        </form>

        <div className="mt-8 space-y-3">
          {records.map((record) => (
            <div key={record._id} className="rounded-2xl bg-white/80 p-4 shadow-glow">
              <p className="text-sm font-semibold">
                {record.childId?.name} · {record.sessionId?.classId?.title}
              </p>
              <p className="text-xs text-ink/70">
                {new Date(record.checkedInAt).toLocaleString()} · {record.status}
              </p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

