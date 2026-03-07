import { useEffect, useState } from 'react';
import api from '../api/api.js';
import { getSelectedLocation, setSelectedLocation } from '../utils/location.js';

export default function LocationSelect({ allowAll = false }) {
  const [locations, setLocations] = useState([]);
  const [selected, setSelected] = useState(getSelectedLocation());

  useEffect(() => {
    api
      .get('/locations')
      .then((res) => {
        const list = res.data || [];
        const options = allowAll ? [{ _id: 'all', slug: 'all', name: 'All locations' }, ...list] : list;
        setLocations(options);

        if (!selected && options.length) {
          setSelected(options[0]);
          setSelectedLocation(options[0]);
        }
      })
      .catch(() => {});
  }, [allowAll]);

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
