import { useEffect, useState } from 'react';
import api from '../api/api.js';
import { getSelectedLocation, setSelectedLocation } from '../utils/location.js';
import { getUser } from '../utils/auth.js';

export default function LocationPicker({ compact = false, allowAll = false }) {
  const [locations, setLocations] = useState([]);
  const [selected, setSelected] = useState(getSelectedLocation());

  useEffect(() => {
    const user = getUser();
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
    const url = isAdmin ? '/locations?all=true' : '/locations';

    api
      .get(url)
      .then((res) => {
        const list = res.data || [];
        const options = allowAll ? [{ _id: 'all', slug: 'all', name: 'All locations' }, ...list] : list;
        setLocations(options);

        // Smarter default selection
        const saved = getSelectedLocation();
        if (!saved && options.length) {
          const userLoc = user?.locationId ? options.find(l => l._id === user.locationId) : null;
          const defaultLoc = userLoc || options[0];
          setSelected(defaultLoc);
          setSelectedLocation(defaultLoc);
        }
      })
      .catch(() => { });
  }, [allowAll, selected]);

  useEffect(() => {
    const handleChange = () => setSelected(getSelectedLocation());
    window.addEventListener('location-change', handleChange);
    return () => window.removeEventListener('location-change', handleChange);
  }, []);

  const handleSelect = (loc) => {
    setSelected(loc);
    setSelectedLocation(loc);
  };

  if (!locations.length) return null;

  if (compact) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-2">
        {locations.map((loc) => (
          <button
            key={loc._id}
            type="button"
            onClick={() => handleSelect(loc)}
            className={`rounded-full border px-5 py-2.5 text-xs font-black uppercase tracking-tight transition-all duration-300 ${
              selected?._id === loc._id 
                ? 'border-brand-blue bg-brand-blue text-white shadow-lg shadow-brand-blue/20 scale-105' 
                : 'border-brand-black/10 bg-white/50 text-brand-black/60 hover:border-brand-blue/30 hover:bg-white hover:text-brand-blue'
            }`}
          >
            {loc.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {locations.map((loc) => (
        <button
          key={loc._id}
          type="button"
          onClick={() => handleSelect(loc)}
          className={`group overflow-hidden rounded-3xl border text-left transition-all duration-300 hover:-translate-y-1 ${
            selected?._id === loc._id ? 'border-brand-blue shadow-glow ring-2 ring-brand-blue/10' : 'border-white/70 bg-white/70'
          }`}
        >
          <div className="h-36 w-full bg-gradient-to-r from-sky-200 via-blue-200 to-emerald-100">
            {loc.imageUrl ? (
              <img src={loc.imageUrl} alt={loc.name} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="p-5">
            <p className="font-display text-base font-black text-brand-black">{loc.name}</p>
            <p className="mt-1 text-xs font-bold text-brand-black/40">
              {loc.city || 'Fitness Studio'} {loc.isOnline ? '· 🌐 Online' : ''}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
