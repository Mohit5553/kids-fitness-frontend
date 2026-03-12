import { useEffect, useState } from 'react';
import api from '../../api/api.js';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';

export default function LocationManagement() {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
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
            const res = await api.get('/locations');
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/locations', formData);
            fetchLocations();
            setShowForm(false);
            setFormData({ name: '', slug: '', city: '', address: '', imageUrl: '', status: 'active' });
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create location');
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
                            <p className="mt-2 text-sm text-white/80">Manage your gym's physical and virtual presence.</p>
                        </div>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-ocean transition hover:bg-opacity-90 active:scale-95"
                        >
                            {showForm ? 'Cancel' : 'Add New Location'}
                        </button>
                    </div>
                </section>

                {showForm && (
                    <div className="mb-10 rounded-[32px] bg-white p-8 shadow-sm border border-slate-100">
                        <h2 className="font-display text-2xl text-ink mb-6">Create New Location</h2>
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
                                <label className="text-xs font-bold uppercase tracking-wider text-ink/50">Image URL</label>
                                <input
                                    type="text"
                                    className="w-full rounded-2xl border-slate-200 bg-slate-50 p-3 text-sm focus:border-coral focus:ring-0"
                                    value={formData.imageUrl}
                                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-ink/50">Address</label>
                                <textarea
                                    className="w-full rounded-2xl border-slate-200 bg-slate-50 p-3 text-sm focus:border-coral focus:ring-0"
                                    value={formData.address} rows="2"
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <button type="submit" className="w-full rounded-2xl bg-coral py-4 font-semibold text-white shadow-lg transition hover:bg-coral-dark active:scale-[0.98]">
                                    Save Location
                                </button>
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
                            <div key={loc._id} className="group overflow-hidden rounded-[32px] bg-white border border-slate-100 shadow-sm transition hover:shadow-md">
                                <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                                    {loc.imageUrl ? (
                                        <img src={loc.imageUrl} alt={loc.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                                    ) : (
                                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-sky-100 to-indigo-50">
                                            <span className="text-4xl">🏢</span>
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 capitalize rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold tracking-widest text-ink/70 backdrop-blur">
                                        {loc.status}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div>
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
                                    <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-4">
                                        <span className="text-xs text-ink/40 font-medium">Slug: /{loc.slug}</span>
                                        <button className="text-xs font-bold text-ocean hover:underline">Edit Details</button>
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
