import { useEffect, useState, useMemo } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';

const emptyForm = {
  classId: '',
  trainerId: '',
  startTime: '',
  endTime: '',
  capacity: '',
  location: '',
  status: 'scheduled'
};

export default function SessionsManagement() {
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    const p1 = api.get('/sessions').then((res) => setSessions(res.data || []));
    const p2 = api.get('/classes').then((res) => setClasses(res.data || []));
    const p3 = api.get('/trainers').then((res) => setTrainers(res.data || []));
    Promise.all([p1, p2, p3]).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Autofill capacity if class is selected and capacity is empty
      if (name === 'classId' && value && !prev.capacity) {
        const cls = classes.find(c => c._id === value);
        if (cls) updated.capacity = cls.capacity || '';
      }
      return updated;
    });
  };

  const filteredTrainers = useMemo(() => {
    if (!form.classId) return trainers;
    const selectedClass = classes.find(c => c._id === form.classId);
    if (!selectedClass || !selectedClass.availableTrainers) return trainers;
    const availableIds = selectedClass.availableTrainers.map(t => t._id || t);
    return trainers.filter(t => availableIds.includes(t._id));
  }, [form.classId, classes, trainers]);

  const handleEdit = (session) => {
    setEditingId(session._id);
    setForm({
      classId: session.classId?._id || session.classId || '',
      trainerId: session.trainerId?._id || session.trainerId || '',
      startTime: session.startTime ? new Date(session.startTime).toISOString().slice(0, 16) : '',
      endTime: session.endTime ? new Date(session.endTime).toISOString().slice(0, 16) : '',
      capacity: session.capacity ?? '',
      location: session.location || '',
      status: session.status || 'scheduled'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

    try {
      if (editingId) {
        await api.put(`/sessions/${editingId}`, payload);
      } else {
        await api.post('/sessions', payload);
      }
      handleCancel();
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save session');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this session? Existing bookings may be affected.')) return;
    await api.delete(`/sessions/${id}`);
    load();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="page-shell flex-1 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
             <h1 className="font-display text-4xl font-black text-ink">Session Manager</h1>
             <p className="mt-1 text-ink/50 font-medium">Schedule specific time slots for trainers and classes.</p>
          </div>
          <div className="flex gap-2">
             <div className="px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                <span className="text-xs font-black uppercase tracking-widest text-ink/60">{sessions.length} Active Slots</span>
             </div>
          </div>
        </div>

        <div className="soft-card rounded-[48px] p-8 md:p-10 mb-10">
          <form className="grid gap-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-ink/30 ml-4">Class Path</label>
                <select
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
                  name="classId"
                  value={form.classId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select class</option>
                  {classes.map((item) => (
                    <option key={item._id} value={item._id}>{item.title}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-ink/30 ml-4">Assigned Trainer</label>
                <select
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
                  name="trainerId"
                  value={form.trainerId}
                  onChange={handleChange}
                   required
                >
                  <option value="">Select trainer</option>
                  {filteredTrainers.map((trainer) => (
                    <option key={trainer._id} value={trainer._id}>{trainer.name}</option>
                  ))}
                </select>
                {form.classId && filteredTrainers.length === 0 && (
                  <p className="text-[10px] text-coral font-bold mt-1 ml-4 italic">No trainers linked to this class!</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-ink/30 ml-4">Start Time & Date</label>
                  <input
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
                    name="startTime"
                    type="datetime-local"
                    value={form.startTime}
                    onChange={handleChange}
                    required
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-ink/30 ml-4">End Time (Optional)</label>
                  <input
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
                    name="endTime"
                    type="datetime-local"
                    value={form.endTime}
                    onChange={handleChange}
                  />
               </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
               <div className="space-y-1.5">
                 <label className="text-[10px] font-black uppercase tracking-widest text-ink/30 ml-4">Slot Capacity</label>
                 <input
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
                    name="capacity"
                    type="number"
                    placeholder="Inherits from class"
                    value={form.capacity}
                    onChange={handleChange}
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-ink/30 ml-4">Studio / Location</label>
                  <input
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
                    name="location"
                    placeholder="Studio A, etc."
                    value={form.location}
                    onChange={handleChange}
                  />
               </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button className="bg-brand-blue text-white px-10 py-4 rounded-full font-black shadow-lg hover:scale-105 active:scale-95 transition-all" type="submit">
                {editingId ? 'Update Session' : 'Create Session'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="text-sm font-bold text-ink/40 hover:text-ink transition-all px-6"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="grid gap-4">
          {sessions.length > 0 ? sessions.map((session) => (
            <div key={session._id} className="soft-card rounded-[32px] p-6 hover:shadow-xl transition-all group flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-100/50">
              <div className="flex items-center gap-6 flex-1">
                <div className="w-16 h-16 rounded-[24px] bg-brand-blue/5 flex flex-col items-center justify-center text-brand-blue">
                   <span className="text-[10px] font-black uppercase tracking-tighter">{new Date(session.startTime).toLocaleDateString('en-US', { month: 'short' })}</span>
                   <span className="text-xl font-black leading-none">{new Date(session.startTime).getDate()}</span>
                </div>
                <div>
                   <h3 className="font-display text-xl text-ink">{session.classId?.title}</h3>
                   <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      <p className="text-xs font-bold text-ink/60 flex items-center gap-1.5">
                         <span className="w-1.5 h-1.5 rounded-full bg-ocean"></span>
                         {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs font-bold text-ink/40">Trainer: <span className="text-brand-blue">{session.trainerId?.name || 'TBA'}</span></p>
                      <p className="text-xs font-bold text-ink/40">Occupancy: <span className={session.bookedParticipants >= session.capacity ? 'text-coral' : 'text-green-500'}>{session.bookedParticipants || 0} / {session.capacity}</span></p>
                   </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  className="rounded-full bg-slate-50 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-ink/60 hover:bg-slate-100 transition-all"
                  onClick={() => handleEdit(session)}
                >
                  Edit
                </button>
                <button
                  className="rounded-full bg-red-50 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-300 hover:bg-red-400 hover:text-white transition-all"
                  onClick={() => handleDelete(session._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          )) : (
            <div className="py-20 text-center bg-white rounded-[48px] border border-dashed border-slate-200">
               <p className="font-display text-xl text-ink/30 italic font-black">No sessions scheduled yet.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

