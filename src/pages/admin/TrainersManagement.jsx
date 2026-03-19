import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  bio: '',
  specialties: '',
  locationId: '',
  avatarUrl: '',
  gallery: [],
  status: 'active'
};

export default function TrainersManagement() {
  const [trainers, setTrainers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [specialtiesList, setSpecialtiesList] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');

  const [uploading, setUploading] = useState(false);

  const load = () => {
    api.get('/trainers').then((res) => setTrainers(res.data || [])).catch(() => { });
    api.get('/locations').then((res) => setLocations(res.data || [])).catch(() => { });
    api.get('/specialties').then((res) => setSpecialtiesList(res.data || [])).catch(() => { });
  };

  useEffect(() => {
    load();
  }, []);

  const handleFileUpload = async (e, isGallery = false) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);

    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };
      const { data } = await api.post('/upload', formData, config);
      if (isGallery) {
        setForm((prev) => ({ ...prev, gallery: [...(prev.gallery || []), data.image] }));
      } else {
        setForm((prev) => ({ ...prev, avatarUrl: data.image }));
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'File upload failed';
      alert(`Upload Failed: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleEdit = (trainer) => {
    setEditingId(trainer._id);
    setForm({
      name: trainer.name || '',
      email: trainer.email || '',
      phone: trainer.phone || '',
      bio: trainer.bio || '',
      specialties: (trainer.specialties || []).join(', '),
      locationId: trainer.locationId?._id || trainer.locationId || '',
      status: trainer.status || 'active',
      avatarUrl: trainer.avatarUrl || '',
      gallery: trainer.gallery || []
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
      specialties: form.specialties.split(',').map((item) => item.trim()).filter(Boolean)
    };

    try {
      if (editingId) {
        await api.put(`/trainers/${editingId}`, payload);
      } else {
        await api.post('/trainers', payload);
      }
      handleCancel();
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save trainer');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this trainer?')) return;
    try {
      await api.delete(`/trainers/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete trainer');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="page-shell pb-12 pt-8">
        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-ocean to-moss p-8 text-white shadow-glow mb-8">
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Admin Center</p>
              <h1 className="mt-3 font-display text-3xl md:text-4xl">Trainer Master</h1>
              <p className="mt-2 text-sm text-white/80">Manage your coaching team, their specialties, and center assignments.</p>
            </div>
            <div className="flex gap-2">
               <button
                onClick={() => handleCancel()}
                className="rounded-full bg-white/10 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 active:scale-95"
              >
                Clear Form
              </button>
            </div>
          </div>
        </section>

        <div className="mb-10 rounded-[32px] bg-white p-8 shadow-sm border border-slate-100">
          <h2 className="font-display text-2xl text-ink mb-6">
            {editingId ? 'Edit Trainer Profile' : 'Register New Trainer'}
          </h2>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-ink/50">Trainer Name</label>
                <input
                  className="w-full rounded-2xl border-slate-200 bg-slate-50 p-3 text-sm focus:border-coral focus:ring-0"
                  name="name"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-ink/50">Email Address</label>
                <input
                  className="w-full rounded-2xl border-slate-200 bg-slate-50 p-3 text-sm focus:border-coral focus:ring-0"
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-ink/50">Phone Number</label>
                <input
                  className="w-full rounded-2xl border-slate-200 bg-slate-50 p-3 text-sm focus:border-coral focus:ring-0"
                  name="phone"
                  placeholder="Phone"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-ink/50">Assigned Branch</label>
                <select
                  className="w-full rounded-2xl border-slate-200 bg-slate-50 p-3 text-sm focus:border-coral focus:ring-0"
                  name="locationId"
                  value={form.locationId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Location</option>
                  {locations.map(loc => (
                    <option key={loc._id} value={loc._id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-ink/50">Duty Status</label>
                <select
                  className="w-full rounded-2xl border-slate-200 bg-slate-50 p-3 text-sm focus:border-coral focus:ring-0"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-ink/50">Avatar / Photo</label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="block w-full text-xs text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-xs file:font-semibold
                      file:bg-ocean file:text-white
                      hover:file:bg-ocean-dark
                      cursor-pointer"
                  />
                  {form.avatarUrl && (
                    <img 
                      src={form.avatarUrl.startsWith('http') ? form.avatarUrl : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${form.avatarUrl}`} 
                      className="h-10 w-10 rounded-full object-cover border" 
                      alt="Preview" 
                    />
                  )}
                  {uploading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-ocean border-t-transparent" />}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-ink/50">Gallery Photos (Multi)</label>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, true)}
                      className="block w-full text-xs text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-xs file:font-semibold
                        file:bg-moss file:text-white
                        hover:file:bg-moss-dark
                        cursor-pointer"
                    />
                    {uploading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-moss border-t-transparent" />}
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {(form.gallery || []).map((img, idx) => (
                      <div key={idx} className="relative group/img w-16 h-16 rounded-xl overflow-hidden border border-slate-200">
                        <img 
                          src={img.startsWith('http') ? img : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${img}`} 
                          className="w-full h-full object-cover" 
                          alt={`Gallery ${idx}`} 
                        />
                        <button 
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== idx) }))}
                          className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                        >
                          <span className="text-[10px] font-bold">Delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-ink/50 flex justify-between">
                <span>Specialties</span>
                <span className="text-[10px] text-ocean normal-case font-medium">Tip: Managed in Specialty Master</span>
              </label>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <select
                    className="flex-1 rounded-2xl border-slate-200 bg-slate-50 p-3 text-sm focus:border-coral focus:ring-0 appearance-none cursor-pointer"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      const current = form.specialties.split(',').map(s => s.trim()).filter(Boolean);
                      if (!current.includes(val)) {
                        setForm({ ...form, specialties: [...current, val].join(', ') });
                      }
                      e.target.value = ""; // Reset dropdown
                    }}
                  >
                    <option value="">Select Specialty to Add...</option>
                    {specialtiesList.filter(s => s.status === 'active').map(spec => (
                      <option key={spec._id} value={spec.name}>{spec.name}</option>
                    ))}
                  </select>
                  <input
                    className="w-1/3 rounded-2xl border-slate-200 bg-slate-100 p-3 text-sm text-ink/40 cursor-not-allowed"
                    name="specialties"
                    placeholder="Selected specialties"
                    value={form.specialties}
                    readOnly
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.specialties.split(',').map(s => s.trim()).filter(Boolean).map((specName, i) => (
                    <span 
                      key={i} 
                      className="group/tag inline-flex items-center gap-1.5 rounded-lg bg-coral/10 px-2.5 py-1 text-[10px] font-bold text-coral"
                    >
                      {specName}
                      <button
                        type="button"
                        onClick={() => {
                          const current = form.specialties.split(',').map(s => s.trim()).filter(Boolean);
                          setForm({ ...form, specialties: current.filter(s => s !== specName).join(', ') });
                        }}
                        className="hover:scale-125 transition-transform"
                      >
                        ?
                      </button>
                    </span>
                  ))}
                  {form.specialties.trim() === "" && <p className="text-[10px] text-ink/20 italic">No specialties selected yet.</p>}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-ink/50">Professional Bio</label>
              <textarea
                className="min-h-[100px] w-full rounded-2xl border-slate-200 bg-slate-50 p-4 text-sm focus:border-coral focus:ring-0"
                name="bio"
                placeholder="Briefly describe the trainer's background and coaching philosophy..."
                value={form.bio}
                onChange={handleChange}
              />
            </div>

            <div className="flex gap-4">
              <button className="flex-1 rounded-2xl bg-coral py-4 text-sm font-bold text-white shadow-lg transition hover:bg-coral-dark active:scale-[0.98]" type="submit">
                {editingId ? 'Update Trainer' : 'Add Trainer to Roster'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="px-10 rounded-2xl bg-slate-100 py-4 text-sm font-bold text-ink/40 hover:bg-slate-200 transition-all"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {trainers.map((trainer) => (
            <div key={trainer._id} className="group relative overflow-hidden rounded-[32px] bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-xl overflow-hidden shrink-0">
                    {trainer.avatarUrl ? (
                      <img 
                        src={trainer.avatarUrl.startsWith('http') ? trainer.avatarUrl : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${trainer.avatarUrl}`} 
                        className="h-full w-full object-cover" 
                        alt={trainer.name} 
                      />
                    ) : '🏆'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg text-ink truncate">{trainer.name}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-blue truncate">
                       {locations.find(l => l._id === (trainer.locationId?._id || trainer.locationId))?.name || 'Unassigned'}
                    </p>
                  </div>
                  <div className={`h-2 w-2 rounded-full ${trainer.status === 'active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {(trainer.specialties || []).length > 0 ? trainer.specialties.map((spec, i) => (
                      <span key={i} className="rounded-md bg-ocean/5 px-2 py-0.5 text-[9px] font-bold text-ocean uppercase tracking-wider">
                        {spec}
                      </span>
                    )) : <span className="text-[10px] text-ink/20 italic">No specialties</span>}
                  </div>
                  <p className="text-xs text-ink/60 line-clamp-2 leading-relaxed h-8">
                    {trainer.bio || 'Detailed coaching profile pending...'}
                  </p>
                  
                  <div className="pt-3 border-t border-slate-50 flex justify-between items-center text-[10px] font-medium text-ink/40">
                    <span>{trainer.email || 'No email'}</span>
                    <div className="flex gap-2">
                       <button
                        className="text-ocean hover:underline"
                        onClick={() => handleEdit(trainer)}
                      >
                        Edit
                      </button>
                      <span className="text-slate-200">|</span>
                      <button
                        className="text-red-400 hover:text-red-600"
                        onClick={() => handleDelete(trainer._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {trainers.length === 0 && (
            <div className="col-span-full py-20 text-center">
               <p className="text-slate-400 italic">No trainers found. Use the form above to add your first coach.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

