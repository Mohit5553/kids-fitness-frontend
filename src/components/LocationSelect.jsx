import { useEffect, useState } from 'react';
import api from '../api/api.js';
import { getSelectedLocation, setSelectedLocation } from '../utils/location.js';
import { useBranch } from '../context/BranchContext.jsx';
import { getUser } from '../utils/auth.js';

export default function LocationSelect({ allowAll = false }) {
  const { selectedBranch, setSelectedBranch, setAvailableBranches } = useBranch();
  const [locations, setLocations] = useState([]);
  const user = getUser();

  useEffect(() => {
    api
      .get('/locations?all=true')
      .then((res) => {
        const list = res.data || [];
        let filtered = list;

        // If not superadmin, only show assigned locations
        if (user && user.role !== 'superadmin') {
          const assignedIds = (user.locationIds || []).map(l => typeof l === 'string' ? l : l._id);
          filtered = list.filter(l => assignedIds.includes(l._id));
        }

        const options = allowAll && (user?.role === 'superadmin') ? [{ _id: 'all', slug: 'all', name: 'All locations' }, ...filtered] : filtered;
        setLocations(options);
        setAvailableBranches(options.map(o => o._id));

        // Default selection logic
        if (!selectedBranch && options.length > 0) {
          setSelectedBranch(options[0]._id);
        }
      })
      .catch(() => { });
  }, [allowAll, user?.role]);


  const handleChange = (event) => {
    const locId = event.target.value;
    const loc = locations.find((item) => item._id === locId);
    if (loc) {
      setSelectedBranch(locId);
      setSelectedLocation(loc); // Keep legacy sync if needed
      // Automatically refresh the page to update all data context
      window.location.reload();
    }
  };

  if (!locations.length) return null;

  return (
    <select
      className="rounded-full border border-ink/10 bg-white/80 px-3 py-2 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
      value={selectedBranch || ''}
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
