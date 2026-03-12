import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';

const emptyForm = {
  classId: '',
  trainerId: '',
  startTime: '',
  endTime: '',
  capacity: '',
  location: ''
};

export default function SessionsManagement() {
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');

  const load = () => {
    api.get('/sessions').then((res) => setSessions(res.data || [])).catch(() => { });
    api.get('/classes').then((res) => setClasses(res.data || [])).catch(() => { });
    api.get('/trainers').then((res) => setTrainers(res.data || [])).catch(() => { });
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleEdit = (session) => {
    setEditingId(session._id);
    setForm({
      classId: session.classId?._id || session.classId || '',
      trainerId: session.trainerId?._id || session.trainerId || '',
      startTime: session.startTime ? new Date(session.startTime).toISOString().slice(0, 16) : '',
      endTime: session.endTime ? new Date(session.endTime).toISOString().slice(0, 16) : '',
      capacity: session.capacity ?? '',
      location: session.location || ''
    });
  };

  const handleCancel = () => {
    setEditingId('');
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      startTime: new Date(form.startTime).toISOString(),
      endTime: form.endTime ? new Date(form.endTime).toISOString() : undefined,
      capacity: form.capacity ? Number(form.capacity) : undefined
    };

    if (editingId) {
      await api.put(`/sessions/${editingId}`, payload);
    } else {
      await api.post('/sessions', payload);
    }

    handleCancel();
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this session?')) return;
    await api.delete(`/sessions/${id}`);
    load();
  };

  const handleQr = async (sessionId) => {
    const res = await api.get(`/sessions/${sessionId}/qr`);
    if (res.data?.token) {
      await navigator.clipboard.writeText(res.data.token);
      alert('QR token copied to clipboard.');
    }
  };

  return (
    <div>
      <Navbar />
      <main className="page-shell py-12">
        <h1 className="font-display text-3xl">Session Calendar</h1>
        <p className="mt-2 text-sm text-ink/70">Schedule class sessions for the booking calendar.</p>

        <form className="mt-6 grid gap-3 rounded-3xl bg-white/80 p-6 shadow-glow" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <select
              className="rounded-xl border border-orange-200/70 p-3"
              name="classId"
              value={form.classId}
              onChange={handleChange}
              required
            >
              <option value="">Select class</option>
              {classes.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.title}
                </option>
              ))}
            </select>
            <select
              className="rounded-xl border border-orange-200/70 p-3"
              name="trainerId"
              value={form.trainerId}
              onChange={handleChange}
            >
              <option value="">Trainer (optional)</option>
              {trainers.map((trainer) => (
                <option key={trainer._id} value={trainer._id}>
                  {trainer.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="rounded-xl border border-orange-200/70 p-3"
              name="startTime"
              type="datetime-local"
              value={form.startTime}
              onChange={handleChange}
              required
            />
            <input
              className="rounded-xl border border-orange-200/70 p-3"
              name="endTime"
              type="datetime-local"
              value={form.endTime}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="rounded-xl border border-orange-200/70 p-3"
              name="capacity"
              type="number"
              placeholder="Capacity"
              value={form.capacity}
              onChange={handleChange}
            />
            <input
              className="rounded-xl border border-orange-200/70 p-3"
              name="location"
              placeholder="Location"
              value={form.location}
              onChange={handleChange}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white" type="submit">
              {editingId ? 'Update session' : 'Create session'}
            </button>
            {editingId ? (
              <button
                type="button"
                className="rounded-full border border-ink/10 px-5 py-3 text-sm font-semibold text-ink"
                onClick={handleCancel}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <div className="mt-8 space-y-3">
          {sessions.map((session) => (
            <div key={session._id} className="rounded-2xl bg-white/80 p-4 shadow-glow">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{session.classId?.title}</p>
                    {session.locationId?.name && (
                      <span className="rounded-full bg-brand-blue/10 px-2 py-0.5 text-[10px] font-bold text-brand-blue">
                        {session.locationId.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink/70">
                    {new Date(session.startTime).toLocaleString()} · {session.location || 'Studio'}
                  </p>
                  <p className="text-xs text-ink/70">Trainer: {session.trainerId?.name || 'TBA'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold"
                    onClick={() => handleEdit(session)}
                  >
                    Edit
                  </button>
                  <button
                    className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold"
                    onClick={() => handleQr(session._id)}
                  >
                    Copy QR
                  </button>
                  <button
                    className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold text-coral"
                    onClick={() => handleDelete(session._id)}
                  >
                    Delete
                  </button>
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

