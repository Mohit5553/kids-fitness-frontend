import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  bio: '',
  specialties: [],
  status: 'active'
};

export default function TrainersManagement() {
  const [trainers, setTrainers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');

  const load = () => {
    api.get('/trainers').then((res) => setTrainers(res.data || [])).catch(() => {});
    api.get('/activities').then((res) => setActivities(res.data || [])).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleToggleSpecialty = (name) => {
    setForm((prev) => {
      const current = Array.isArray(prev.specialties) ? prev.specialties : [];
      const updated = current.includes(name)
        ? current.filter((s) => s !== name)
        : [...current, name];
      return { ...prev, specialties: updated };
    });
  };

  const handleEdit = (trainer) => {
    setEditingId(trainer._id);
    setForm({
      name: trainer.name || '',
      email: trainer.email || '',
      phone: trainer.phone || '',
      bio: trainer.bio || '',
      specialties: Array.isArray(trainer.specialties) ? trainer.specialties : [],
      status: trainer.status || 'active'
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
      specialties: Array.isArray(form.specialties) ? form.specialties : []
    };

    if (editingId) {
      await api.put(`/trainers/${editingId}`, payload);
    } else {
      await api.post('/trainers', payload);
    }

    handleCancel();
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this trainer?')) return;
    await api.delete(`/trainers/${id}`);
    load();
  };

  return (
    <div>
      <Navbar />
      <main className="page-shell py-12">
        <h1 className="font-display text-3xl">Trainer Management</h1>
        <p className="mt-2 text-sm text-ink/70">Add coaches and update their profiles.</p>

        <form className="mt-6 grid gap-3 rounded-3xl bg-white/80 p-6 shadow-glow" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="rounded-xl border border-orange-200/70 p-3"
              name="name"
              placeholder="Trainer name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              className="rounded-xl border border-orange-200/70 p-3"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="rounded-xl border border-orange-200/70 p-3"
              name="phone"
              placeholder="Phone"
              value={form.phone}
              onChange={handleChange}
            />
            <select
              className="rounded-xl border border-orange-200/70 p-3"
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div className="rounded-xl border border-orange-200/70 p-3 bg-white/50">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink/40">Specialties (Select from Master List)</p>
            <div className="flex flex-wrap gap-2">
              {activities.length > 0 ? (
                activities.map((act) => (
                  <button
                    key={act._id}
                    type="button"
                    onClick={() => handleToggleSpecialty(act.name)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      Array.isArray(form.specialties) && form.specialties.includes(act.name)
                        ? 'border-coral bg-coral/10 text-coral'
                        : 'border-ink/10 text-ink/60'
                    }`}
                  >
                    {act.name}
                  </button>
                ))
              ) : (
                <p className="text-xs text-ink/40 italic">No activities found. Add them in Activity Master first.</p>
              )}
            </div>
          </div>

          <textarea
            className="min-h-[90px] rounded-xl border border-orange-200/70 p-3"
            name="bio"
            placeholder="Short bio"
            value={form.bio}
            onChange={handleChange}
          />
          <div className="flex flex-wrap gap-3">
            <button className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white" type="submit">
              {editingId ? 'Update trainer' : 'Add trainer'}
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

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {trainers.map((trainer) => (
            <div key={trainer._id} className="rounded-2xl bg-white/80 p-4 shadow-glow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{trainer.name}</p>
                  <p className="text-xs text-ink/70">{trainer.email}</p>
                  <p className="text-xs text-ink/70">{trainer.phone}</p>
                </div>
                <p className="text-xs text-ink/60">{trainer.status}</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {Array.isArray(trainer.specialties) && trainer.specialties.map(s => (
                  <span key={s} className="rounded-full bg-ink/5 px-2 py-0.5 text-[9px] font-bold text-ink/50 uppercase">
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex gap-3">
                <button
                  className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold"
                  onClick={() => handleEdit(trainer)}
                >
                  Edit
                </button>
                <button
                  className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold"
                  onClick={() => handleDelete(trainer._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
