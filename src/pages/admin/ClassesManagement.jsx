import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';
import toast from 'react-hot-toast';
import { usePermissions } from '../../hooks/usePermissions.js';

const emptyForm = {
  title: '',
  description: '',
  ageGroup: '',
  minAge: '',
  maxAge: '',
  genderRestriction: 'any',
  duration: '',
  availableTrainers: [],
  price: '',
  capacity: '',
  status: 'active'
};

export default function ClassesManagement() {
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const { can } = usePermissions();

  const canCreate = can('classes:create');
  const canEdit = can('classes:edit');
  const canDelete = can('classes:delete');

  const load = () => {
    setLoading(true);
    const p1 = api.get('/classes?all=true').then((res) => setClasses(res.data || [])).catch(() => { });
    const p2 = api.get('/trainers?all=true').then((res) => setTrainers(res.data || [])).catch(() => { });
    Promise.all([p1, p2]).finally(() => setLoading(false));
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
      minAge: item.minAge ?? '',
      maxAge: item.maxAge ?? '',
      genderRestriction: item.genderRestriction || 'any',
      duration: item.duration || '',
      availableTrainers: (item.availableTrainers || []).map(t => t._id || t),
      price: item.price ?? '',
      capacity: item.capacity ?? '',
      status: item.status || 'active'
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

  const handleToggleStatus = async (item) => {
    const action = item.status === 'active' ? 'disable' : 'enable';
    if (!window.confirm(`Are you sure you want to ${action} this class?`)) return;
    try {
      await api.delete(`/classes/${item._id}`);
      toast.success(`Class ${action}d successfully`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} class`);
    }
  };

  return (
    <div>
      <Navbar />
      <main className="page-shell py-12">
        <h1 className="font-display text-3xl">Classes Management</h1>
        <p className="mt-2 text-sm text-ink/70">Create, update, and schedule classes.</p>
        {message ? <p className="mt-3 text-sm text-coral">{message}</p> : null}

        {canCreate || (editingId && canEdit) ? (
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
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-ink/30 px-3 uppercase tracking-widest">Min Age</label>
                <input
                  className="w-full rounded-xl border border-orange-200/70 p-3"
                  name="minAge"
                  type="number"
                  placeholder="Min Age"
                  value={form.minAge}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-ink/30 px-3 uppercase tracking-widest">Max Age</label>
                <input
                  className="w-full rounded-xl border border-orange-200/70 p-3"
                  name="maxAge"
                  type="number"
                  placeholder="Max Age"
                  value={form.maxAge}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-ink/30 px-3 uppercase tracking-widest">Gender</label>
                <select
                  className="w-full rounded-xl border border-orange-200/70 p-3"
                  name="genderRestriction"
                  value={form.genderRestriction}
                  onChange={handleChange}
                >
                  <option value="any">Any</option>
                  <option value="male">Male Only</option>
                  <option value="female">Female Only</option>
                </select>
              </div>
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
              <div className="rounded-xl border border-orange-200/70 p-3">
                <p className="text-[10px] font-bold text-ink/40 uppercase mb-2">Available Trainers</p>
                <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto">
                  {trainers.map(t => (
                    <label key={t._id} className="flex items-center gap-2 text-xs font-bold text-ink/70 bg-slate-50 px-3 py-1.5 rounded-full cursor-pointer hover:bg-slate-100 transition-all">
                      <input
                        type="checkbox"
                        checked={form.availableTrainers.includes(t._id)}
                        onChange={(e) => {
                          const newTrainers = e.target.checked
                            ? [...form.availableTrainers, t._id]
                            : form.availableTrainers.filter(id => id !== t._id);
                          setForm({ ...form, availableTrainers: newTrainers });
                        }}
                        className="accent-brand-blue"
                      />
                      {t.name}
                    </label>
                  ))}
                </div>
              </div>
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
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="rounded-xl border border-orange-200/70 p-3"
                name="capacity"
                type="number"
                placeholder="Capacity"
                value={form.capacity}
                onChange={handleChange}
              />
              <div className="space-y-1">
                <label className="text-[10px] font-black text-ink/30 px-3 uppercase tracking-widest">Visibility Status</label>
                <select
                  className="w-full rounded-xl border border-orange-200/70 p-3"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="active">Active (Visible)</option>
                  <option value="inactive">Inactive (Hidden)</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-full bg-brand-blue px-8 py-3 text-sm font-black text-white shadow-lg hover:scale-105 transition-all" type="submit">
                {editingId ? 'Update class' : 'Create class'}
              </button>
              {editingId ? (
                <button
                  type="button"
                  className="rounded-full border border-ink/10 px-8 py-3 text-sm font-black text-ink hover:bg-slate-50 transition-all"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        ) : (
          <div className="mt-6 p-6 bg-white/50 rounded-3xl border border-dashed border-slate-200 text-center">
            <p className="text-sm font-bold text-ink/30 italic">You don't have permission to {editingId ? 'edit' : 'create'} classes.</p>
          </div>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {loading ? (
             Array(4).fill(0).map((_, i) => <div key={i} className="h-48 animate-pulse bg-white rounded-3xl" />)
          ) : classes.map((item) => (
            <div key={item._id} className="soft-card rounded-[32px] p-6 transition-all hover:shadow-xl group">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-xl text-ink leading-tight">{item.title}</h3>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-ocean bg-ocean/5 px-2 py-0.5 rounded-full">{item.ageGroup}</span>
                    {item.minAge || item.maxAge ? (
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        {item.minAge || 0}-{item.maxAge || '∞'} yrs
                      </span>
                    ) : null}
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{item.genderRestriction}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-ink/30 bg-slate-50 px-2 py-0.5 rounded-full">{item.duration}</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-ink/30 mb-1">Available Trainers</p>
                    <div className="flex flex-wrap gap-1">
                      {item.availableTrainers?.length > 0 ? item.availableTrainers.map(t => (
                        <span key={t._id} className="text-[10px] font-bold text-brand-blue bg-brand-blue/5 px-2 py-0.5 rounded-full">{t.name}</span>
                      )) : <span className="text-[10px] font-bold text-ink/20">None linked</span>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="text-xl font-black text-brand-blue">AED {item.price}</p>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.status === 'inactive' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-green-50 text-green-500 border border-green-100'}`}>
                    {item.status || 'Active'}
                  </span>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-50 flex gap-3">
                {canEdit && (
                  <button
                    className="rounded-full bg-slate-50 px-6 py-2 text-xs font-black uppercase tracking-widest text-ink/60 hover:bg-slate-100 transition-all"
                    onClick={() => handleEdit(item)}
                  >
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    className={`rounded-full px-6 py-2 text-xs font-black uppercase tracking-widest transition-all ${item.status === 'active' ? 'bg-red-50 text-red-400 hover:bg-red-100' : 'bg-green-50 text-green-500 hover:bg-green-100'}`}
                    onClick={() => handleToggleStatus(item)}
                  >
                    {item.status === 'active' ? 'Disable' : 'Enable'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

