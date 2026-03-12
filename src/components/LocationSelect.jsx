import { useEffect, useState } from 'react';
import api from '../api/api.js';
import { getSelectedLocation, setSelectedLocation } from '../utils/location.js';
import { getUser } from '../utils/auth.js';

export default function LocationSelect({ allowAll = false }) {
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

        // Smarter default selection for sync across components
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

  const handleChange = (event) => {
    const loc = locations.find((item) => item._id === event.target.value);
    if (loc) {
      setSelected(loc);
      setSelectedLocation(loc);
      // Automatically refresh the page to update all data context
      window.location.reload();
    }
  };

  if (!locations.length) return null;

  return (
    <select
      className="rounded-full border border-ink/10 bg-white/80 px-3 py-2 text-xs font-semibold text-ink"
      value={selected?._id || ''}
      onChange={handleChange}
    >
      {locations.map((loc) => (
        <option key={loc._id} value={loc._id}>
          {loc.name}
        </option>
      ))}
    </select>
  );
}
