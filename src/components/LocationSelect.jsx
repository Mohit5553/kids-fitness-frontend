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
    const loadData = async () => {
      try {
        // 1. Fetch latest user profile to sync permissions (crucial for staff)
        const meRes = await api.get('/auth/me');
        const freshUser = meRes.data;
        if (freshUser) {
          const localUser = JSON.parse(localStorage.getItem('user') || '{}');
          localStorage.setItem('user', JSON.stringify({ ...localUser, ...freshUser }));
        }

        // 2. Fetch all locations
        const locRes = await api.get('/locations?all=true');
        const list = locRes.data || [];
        const isSuper = freshUser?.role === 'superadmin';
        
        let filtered = list;

        // If not superadmin, only show assigned locations
        if (!isSuper) {
          const assignedIds = (freshUser.locationIds || []).map(l => typeof l === 'string' ? l : l._id);
          filtered = list.filter(l => assignedIds.includes(l._id));
        }

        // Superadmins always get the 'All locations' option
        const options = isSuper ? [{ _id: 'all', slug: 'all', name: 'All locations' }, ...list] : filtered;
        
        setLocations(options);
        setAvailableBranches(options.map(o => o._id));

        // Default selection logic
        if (!selectedBranch && options.length > 0) {
          setSelectedBranch(options[0]._id);
        }
      } catch (err) {
        console.error("Error loading location data", err);
      }
    };

    loadData();
  }, [allowAll]);


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
