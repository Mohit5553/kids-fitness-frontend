import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';
import { usePermissions } from '../../hooks/usePermissions.js';

const emptyForm = {
  name: '',
  description: '',
  status: 'active'
};

export default function SpecialtiesManagement() {
  const [specialties, setSpecialties] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const { can } = usePermissions();

  const canCreate = can('specialties:create');
  const canEdit = can('specialties:edit');
  const canDelete = can('specialties:delete');

  const load = () => {
    setLoading(true);
    api.get('/specialties')
      .then((res) => setSpecialties(res.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleEdit = (spec) => {
    setEditingId(spec._id);
    setForm({
      name: spec.name || '',
      description: spec.description || '',
      status: spec.status || 'active'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId('');
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editingId) {
        await api.put(`/specialties/${editingId}`, form);
      } else {
        await api.post('/specialties', form);
      }
      handleCancel();
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save specialty');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this specialty?')) return;
    try {
      await api.delete(`/specialties/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete specialty');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="page-shell py-12">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-white shadow-glow mb-8">
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Master Data</p>
            <h1 className="mt-3 font-display text-3xl md:text-4xl">Specialty Master</h1>
            <p className="mt-2 text-sm text-white/80 max-w-xl">Configure the specific expertise areas that trainers can be assigned to.</p>
          </div>
        </section>

        <div className={`grid gap-8 ${canCreate || editingId ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
          {/* Form Section */}
          {(canCreate || editingId) && (
            <div className="lg:col-span-1">
            <div className="sticky top-8 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h2 className="font-display text-xl text-ink mb-6">
                {editingId ? 'Edit Specialty' : 'Add New Specialty'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-ink/40 ml-1">Specialty Name</label>
                  <input
                    className="w-full rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-sm font-bold focus:border-coral focus:ring-0"
                    name="name"
                    placeholder="e.g. Swimming, Yoga, Karate"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-ink/40 ml-1">Description</label>
                  <textarea
                    className="w-full min-h-[100px] rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-sm font-medium focus:border-coral focus:ring-0"
                    name="description"
                    placeholder="Short description of this specialty..."
                    value={form.description}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-ink/40 ml-1">Status</label>
                  <select
                    className="w-full rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-sm font-bold focus:border-coral focus:ring-0 appearance-none"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button className="flex-1 rounded-full bg-coral py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-coral/20 hover:bg-coral-dark" type="submit">
                    {editingId ? 'Update' : 'Register'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      className="px-6 rounded-full bg-slate-100 py-3 text-xs font-black uppercase tracking-widest text-ink/40 hover:bg-slate-200"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
          )}

          {/* List Section */}
          <div className={canCreate || editingId ? 'lg:col-span-2' : 'lg:col-span-1'}>
            <div className={`grid gap-4 ${canCreate || editingId ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-32 animate-pulse rounded-3xl bg-slate-200" />
                ))
              ) : specialties.length > 0 ? (
                specialties.map((spec) => (
                  <div key={spec._id} className="group relative rounded-3xl bg-white p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-display text-lg font-black text-ink">{spec.name}</h3>
                        <p className="mt-1 text-xs text-ink/60 line-clamp-2">{spec.description || 'No description provided.'}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter ${spec.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                        {spec.status}
                      </span>
                    </div>
                    
                    <div className="mt-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {canEdit && (
                        <button
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white"
                          onClick={() => handleEdit(spec)}
                        >
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          className="rounded-lg border border-red-50 bg-red-50 px-2.5 py-1.5 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                          onClick={() => handleDelete(spec._id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center">
                  <p className="text-slate-400 italic">No specialties registered yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
