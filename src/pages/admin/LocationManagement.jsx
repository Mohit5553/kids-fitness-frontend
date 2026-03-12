import { useEffect, useState } from 'react';
import api from '../../api/api.js';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';

export default function LocationManagement() {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        city: '',
        address: '',
        imageUrl: '',
        status: 'active'
    });

    const fetchLocations = async () => {
        try {
            // Fetch all locations (including inactive ones) via query param
            const res = await api.get('/locations?all=true');
            setLocations(res.data);
        } catch (err) {
            console.error('Failed to fetch locations', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLocations();
    }, []);

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', slug: '', city: '', address: '', imageUrl: '', status: 'active' });
    };

    const handleEdit = (loc) => {
        setEditingId(loc._id);
        setFormData({
            name: loc.name || '',
            slug: loc.slug || '',
            city: loc.city || '',
            address: loc.address || '',
            imageUrl: loc.imageUrl || '',
            status: loc.status || 'active'
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const dataObj = new FormData();
        dataObj.append('image', file);
        setUploading(true);

        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            };
            const { data } = await api.post('/uploads', dataObj, config);
            setFormData({ ...formData, imageUrl: data.image });
        } catch (err) {
            console.error('Upload error details:', err);
            const message = err.response?.data?.message || 'File upload failed';
            alert(message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/locations/${editingId}`, formData);
            } else {
                await api.post('/locations', formData);
            }
            fetchLocations();
            handleCancel();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save location');
        }
    };

    const toggleStatus = async (loc) => {
        const newStatus = loc.status === 'active' ? 'inactive' : 'active';
        try {
            await api.put(`/locations/${loc._id}`, { status: newStatus });
            fetchLocations();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this location?')) return;
        try {
            await api.delete(`/locations/${id}`);
            fetchLocations();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete location');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="page-shell pb-12 pt-8">
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-ocean to-moss p-8 text-white shadow-glow mb-8">
                    <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Admin Center</p>
                            <h1 className="mt-3 font-display text-3xl md:text-4xl">Location Management</h1>
                            <div className="mt-4 flex gap-6">
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/20">
                                    <p className="text-[10px] uppercase font-bold text-white/60">Active</p>
                                    <p className="text-xl font-display">{locations.filter(l => l.status === 'active').length}</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/20">
                                    <p className="text-[10px] uppercase font-bold text-white/60">Inactive</p>
                                    <p className="text-xl font-display">{locations.filter(l => l.status === 'inactive').length}</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => showForm ? handleCancel() : setShowForm(true)}
                            className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-ocean transition hover:bg-opacity-90 active:scale-95"
                        >
                            {showForm ? 'Cancel' : 'Add New Location'}
                        </button>
                    </div>
                </section>

                {showForm && (
                    <div className="mb-10 rounded-[32px] bg-white p-8 shadow-sm border border-slate-100">
                        <h2 className="font-display text-2xl text-ink mb-6">{editingId ? 'Edit Location' : 'Create New Location'}</h2>
                        <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-ink/50">Location Name</label>
                                <input
                                    type="text" required
                                    className="w-full rounded-2xl border-slate-200 bg-slate-50 p-3 text-sm focus:border-coral focus:ring-0"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Dubai Marina"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-ink/50">Slug (URL snippet)</label>
                                <input
                                    type="text" required
                                    className="w-full rounded-2xl border-slate-200 bg-slate-50 p-3 text-sm focus:border-coral focus:ring-0"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    placeholder="e.g. dubai-marina"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-ink/50">City</label>
                                <input
                                    type="text"
                                    className="w-full rounded-2xl border-slate-200 bg-slate-50 p-3 text-sm focus:border-coral focus:ring-0"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    placeholder="Dubai"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-ink/50">Location Image</label>
                                <div className="flex flex-col gap-2">
                                    <input
                                        type="file"
                                        className="w-full rounded-2xl border-slate-200 bg-slate-50 p-3 text-sm focus:border-coral focus:ring-0"
                                        onChange={handleFileUpload}
                                        accept="image/*"
                                    />
                                    {uploading && <p className="text-xs text-ocean animate-pulse">Uploading...</p>}
                                    {formData.imageUrl && (
                                        <div className="h-20 w-32 rounded-xl overflow-hidden border border-slate-200">
                                            <img 
                                                src={formData.imageUrl.startsWith('http') ? formData.imageUrl : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${formData.imageUrl}`} 
                                                alt="Preview" 
                                                className="h-full w-full object-cover" 
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-ink/50">Address</label>
                                <textarea
                                    className="w-full rounded-2xl border-slate-200 bg-slate-50 p-3 text-sm focus:border-coral focus:ring-0"
                                    value={formData.address} rows="2"
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-ink/50">Status</label>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, status: 'active' })}
                                        className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all border ${formData.status === 'active'
                                                ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm'
                                                : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                                            }`}
                                    >
                                        Active
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, status: 'inactive' })}
                                        className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all border ${formData.status === 'inactive'
                                                ? 'bg-slate-100 border-slate-500 text-slate-600 shadow-sm'
                                                : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                                            }`}
                                    >
                                        Inactive
                                    </button>
                                </div>
                            </div>
                            <div className="md:col-span-2 flex gap-4 mt-2">
                                <button type="submit" className="flex-1 rounded-2xl bg-coral py-4 font-semibold text-white shadow-lg transition hover:bg-coral-dark active:scale-[0.98]">
                                    {editingId ? 'Update Location' : 'Save Location'}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="rounded-2xl bg-slate-100 px-8 py-4 font-semibold text-slate-600 transition hover:bg-slate-200 active:scale-[0.98]"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {loading ? (
                        Array(3).fill(0).map((_, i) => (
                            <div key={i} className="h-64 animate-pulse rounded-[32px] bg-slate-200" />
                        ))
                    ) : locations.length > 0 ? (
                        locations.map((loc) => (
                            <div key={loc._id} className={`group overflow-hidden rounded-[32px] bg-white border-2 shadow-sm transition hover:shadow-md ${loc.status === 'inactive' ? 'border-rose-100' : 'border-slate-100'}`}>
                                <div className="relative h-40 w-full overflow-hidden bg-slate-100 transition-opacity duration-500">
                                    {loc.imageUrl ? (
                                        <img 
                                            src={loc.imageUrl.startsWith('http') ? loc.imageUrl : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${loc.imageUrl}`} 
                                            alt={loc.name} 
                                            className="h-full w-full object-cover transition duration-500 group-hover:scale-110" 
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-sky-100 to-indigo-50">
                                            <span className="text-4xl">🏢</span>
                                        </div>
                                    )}
                                    {loc.status === 'inactive' && (
                                        <div className="absolute inset-0 bg-rose-500/10 flex items-center justify-center backdrop-blur-[1px]">
                                            <span className="bg-rose-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-lg border-2 border-white/20">
                                                Hidden from Parents
                                            </span>
                                        </div>
                                    )}
                                    <div className={`absolute top-4 right-4 capitalize rounded-full px-3 py-1 text-[10px] font-bold tracking-widest backdrop-blur shadow-sm ${loc.status === 'active'
                                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                            : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                                        }`}>
                                        {loc.status}
                                    </div>
                                </div>
                                <div className={`p-6 transition-colors duration-500 ${loc.status === 'inactive' ? 'bg-rose-50/10' : 'bg-white'}`}>
                                    <div className="flex items-start justify-between">
                                        <div className={loc.status === 'inactive' ? 'opacity-60' : ''}>
                                            <h3 className="font-display text-xl text-ink">{loc.name}</h3>
                                            <p className="text-sm text-ink/60">{loc.city || 'No city specified'}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(loc._id)}
                                            className="rounded-full bg-red-50 p-2 text-red-500 transition hover:bg-red-500 hover:text-white"
                                            title="Delete Location"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="mt-4 flex flex-col gap-3 border-t border-slate-50 pt-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-ink/40 font-medium italic">Slug: /{loc.slug}</span>
                                            <button 
                                                onClick={() => handleEdit(loc)}
                                                className="text-xs font-bold text-ocean hover:underline"
                                            >
                                                Edit Details
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => toggleStatus(loc)}
                                            className={`w-full rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] border shadow-sm ${loc.status === 'active'
                                                ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'
                                                : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                                            }`}
                                        >
                                            {loc.status === 'active' ? 'Mark as Inactive' : 'Mark as Active'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="md:col-span-3 py-20 text-center">
                            <p className="text-slate-400">No locations found. Add your first gym location above.</p>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
