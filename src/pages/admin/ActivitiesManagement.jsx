import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';

const emptyForm = {
  name: '',
  description: '',
  status: 'active'
};

export default function ActivitiesManagement() {
  const [activities, setActivities] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');

  const load = () => {
    api.get('/activities').then((res) => setActivities(res.data || [])).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleEdit = (activity) => {
    setEditingId(activity._id);
    setForm({
      name: activity.name || '',
      description: activity.description || '',
      status: activity.status || 'active'
    });
  };

  const handleCancel = () => {
    setEditingId('');
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (editingId) {
      await api.put(`/activities/${editingId}`, form);
    } else {
      await api.post('/activities', form);
    }
    handleCancel();
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this activity? This will remove it from the master list.')) return;
    await api.delete(`/activities/${id}`);
    load();
  };

  return (
    <div>
      <Navbar />
      <main className="page-shell py-12">
        <h1 className="font-display text-3xl">Activity Master</h1>
        <p className="mt-2 text-sm text-ink/70">Define activities and specialties for the studio.</p>

        <form className="mt-6 grid gap-3 rounded-3xl bg-white/80 p-6 shadow-glow" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="rounded-xl border border-orange-200/70 p-3"
              name="name"
              placeholder="Activity Name (e.g. Karate, Ballet)"
              value={form.name}
              onChange={handleChange}
              required
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
          <textarea
            className="min-h-[90px] rounded-xl border border-orange-200/70 p-3"
            name="description"
            placeholder="Short description"
            value={form.description}
            onChange={handleChange}
          />
          <div className="flex flex-wrap gap-3">
            <button className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white" type="submit">
              {editingId ? 'Update Activity' : 'Add Activity'}
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

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => (
            <div key={activity._id} className="rounded-2xl bg-white/80 p-5 shadow-glow border border-ink/5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-lg">{activity.name}</p>
                  <p className="mt-1 text-xs text-ink/60 line-clamp-2">{activity.description}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${activity.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {activity.status}
                </span>
              </div>
              <div className="mt-4 flex gap-3 border-t border-ink/5 pt-4">
                <button
                  className="rounded-full border border-ink/10 px-4 py-1.5 text-xs font-semibold hover:bg-ink/5"
                  onClick={() => handleEdit(activity)}
                >
                  Edit
                </button>
                <button
                  className="rounded-full border border-rose-200 px-4 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  onClick={() => handleDelete(activity._id)}
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
