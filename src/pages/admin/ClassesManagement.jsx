import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';

const emptyForm = {
  title: '',
  description: '',
  ageGroup: '',
  duration: '',
  trainerId: '',
  price: '',
  capacity: ''
};

export default function ClassesManagement() {
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [message, setMessage] = useState('');

  const load = () => {
    api.get('/classes').then((res) => setClasses(res.data || [])).catch(() => {});
    api.get('/trainers').then((res) => setTrainers(res.data || [])).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      title: item.title || '',
      description: item.description || '',
      ageGroup: item.ageGroup || '',
      duration: item.duration || '',
      trainerId: item.trainerId?._id || item.trainerId || '',
      price: item.price ?? '',
      capacity: item.capacity ?? ''
    });
  };

  const handleCancel = () => {
    setEditingId('');
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    const payload = {
      ...form,
      price: Number(form.price),
      capacity: form.capacity ? Number(form.capacity) : undefined
    };

    try {
      if (editingId) {
        await api.put(`/classes/${editingId}`, payload);
        setMessage('Class updated.');
      } else {
        await api.post('/classes', payload);
        setMessage('Class created.');
      }
      handleCancel();
      load();
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Unable to save class.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this class?')) return;
    await api.delete(`/classes/${id}`);
    load();
  };

  return (
    <div>
      <Navbar />
      <main className="page-shell py-12">
        <h1 className="font-display text-3xl">Classes Management</h1>
        <p className="mt-2 text-sm text-ink/70">Create, update, and schedule classes.</p>
        {message ? <p className="mt-3 text-sm text-coral">{message}</p> : null}

        <form className="mt-6 grid gap-3 rounded-3xl bg-white/80 p-6 shadow-glow" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="rounded-xl border border-orange-200/70 p-3"
              name="title"
              placeholder="Class title"
              value={form.title}
              onChange={handleChange}
              required
            />
            <input
              className="rounded-xl border border-orange-200/70 p-3"
              name="ageGroup"
              placeholder="Age group"
              value={form.ageGroup}
              onChange={handleChange}
            />
          </div>
          <textarea
            className="min-h-[90px] rounded-xl border border-orange-200/70 p-3"
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
          />
          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="rounded-xl border border-orange-200/70 p-3"
              name="duration"
              placeholder="Duration (e.g. 45 min)"
              value={form.duration}
              onChange={handleChange}
            />
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
            <input
              className="rounded-xl border border-orange-200/70 p-3"
              name="price"
              type="number"
              placeholder="Price"
              value={form.price}
              onChange={handleChange}
              required
            />
          </div>
          <input
            className="rounded-xl border border-orange-200/70 p-3"
            name="capacity"
            type="number"
            placeholder="Capacity"
            value={form.capacity}
            onChange={handleChange}
          />
          <div className="flex flex-wrap gap-3">
            <button className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white" type="submit">
              {editingId ? 'Update class' : 'Create class'}
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
          {classes.map((item) => (
            <div key={item._id} className="rounded-2xl bg-white/80 p-4 shadow-glow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-xs text-ink/70">{item.ageGroup}</p>
                  <p className="text-xs text-ink/70">{item.duration}</p>
                  <p className="text-xs text-ink/70">
                    Trainer: {item.trainerId?.name || item.trainer || 'TBA'}
                  </p>
                </div>
                <p className="text-sm font-semibold text-ocean">AED {item.price}</p>
              </div>
              <div className="mt-3 flex gap-3">
                <button
                  className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold"
                  onClick={() => handleEdit(item)}
                >
                  Edit
                </button>
                <button
                  className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold"
                  onClick={() => handleDelete(item._id)}
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

