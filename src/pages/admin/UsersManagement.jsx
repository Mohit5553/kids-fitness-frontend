import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';
import toast from 'react-hot-toast';
import { getUser } from '../../utils/auth.js';

const MODULES = [
  { id: 'classes', label: 'Classes' },
  { id: 'programs', label: 'Programs' },
  { id: 'sessions', label: 'Session Calendar' },
  { id: 'trainers', label: 'Trainer Master' },
  { id: 'pricing', label: 'Pricing & Plans' },
  { id: 'bookings', label: 'Booking Management' },
  { id: 'users', label: 'User Management' },
  { id: 'trials', label: 'Trial Requests' },
  { id: 'attendance', label: 'Attendance Tracker' },
  { id: 'payments', label: 'Payment Monitoring' },
  { id: 'locations', label: 'Branch Management' },
  { id: 'specialties', label: 'Specialty Master' },
  { id: 'reports', label: 'Detailed Reports' },
  { id: 'roles', label: 'Role Master' }
];

const ACTIONS = [
  { id: 'view', label: 'View' },
  { id: 'create', label: 'Create' },
  { id: 'edit', label: 'Edit' },
  { id: 'delete', label: 'Delete' }
];

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [expandedUser, setExpandedUser] = useState(null);
  const [userChildren, setUserChildren] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [customRoles, setCustomRoles] = useState([]);
  const [locations, setLocations] = useState([]);
  
  // Staff Creation Form State
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    phone: '',
    locationId: ''
  });

  const user = getUser();
  const permissions = user?.permissions || [];
  const isAdminOrSuper = user?.role === 'superadmin' || user?.role === 'admin';
  const canCreate = isAdminOrSuper || permissions.includes('users:create');
  const canEdit = isAdminOrSuper || permissions.includes('users:edit');
  const canDelete = isAdminOrSuper || permissions.includes('users:delete');

  const load = () => {
    setLoading(true);
    api.get('/users').then(res => {
      setUsers(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api.get('/roles').then(res => setCustomRoles(res.data || [])).catch(() => {});
    api.get('/locations?all=true').then(res => setLocations(res.data || [])).catch(() => {});
  }, []);

  const updateRole = async (id, role) => {
    try {
      await api.put(`/users/${id}`, { role });
      toast.success('User role updated');
      load();
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User removed');
      load();
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const fetchChildren = async (userId) => {
    if (userChildren[userId]) return;
    try {
      const res = await api.get(`/users/${userId}/children`);
      setUserChildren(prev => ({ ...prev, [userId]: res.data }));
    } catch (err) {
      console.error('Failed to fetch children');
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', staffForm);
      toast.success('Staff user created successfully');
      setShowAddStaff(false);
      setStaffForm({ name: '', email: '', password: '', role: 'admin', phone: '', locationId: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create staff');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone?.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="page-shell py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="font-display text-4xl font-black text-ink tracking-tight">Staff & User Management</h1>
            <p className="mt-2 text-sm text-ink/70 font-medium tracking-wide">Manage access, roles, and profiles for everyone on the platform.</p>
          </div>
          {canCreate && (
            <button 
              onClick={() => setShowAddStaff(!showAddStaff)}
              className="bg-ink text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-ink/90 transition-all active:scale-95 shadow-xl flex items-center gap-3"
            >
              {showAddStaff ? 'Cancel' : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                  Add New Staff
                </>
              )}
            </button>
          )}
        </div>

        {/* Staff Creation Form */}
        {showAddStaff && (
          <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-white rounded-[32px] p-8 shadow-2xl border border-slate-100 max-w-2xl mx-auto">
              <h2 className="font-display text-xl font-bold text-ink mb-6">Create Staff Account</h2>
              <form onSubmit={handleCreateStaff} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-ink/30 uppercase tracking-widest block mb-2">Full Name</label>
                  <input type="text" required value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-ink/30 uppercase tracking-widest block mb-2">Email Address</label>
                  <input type="email" required value={staffForm.email} onChange={e => setStaffForm({...staffForm, email: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-ink/30 uppercase tracking-widest block mb-2">Password</label>
                  <input type="password" required value={staffForm.password} onChange={e => setStaffForm({...staffForm, password: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-ink/30 uppercase tracking-widest block mb-2">Initial Role</label>
                  <select value={staffForm.role} onChange={e => setStaffForm({...staffForm, role: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-bold">
                    <option value="admin">Admin</option>
                    <option value="trainer">Trainer</option>
                    {customRoles.map(r => <option key={r._id} value={r.name}>{r.name}</option>)}
                  </select>
                </div>
                {user?.role === 'superadmin' && (
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-ink/30 uppercase tracking-widest block mb-2">Branch Assignment</label>
                    <select 
                      required
                      value={staffForm.locationId} 
                      onChange={e => setStaffForm({...staffForm, locationId: e.target.value})} 
                      className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-bold"
                    >
                      <option value="">Select Branch</option>
                      {locations.map(loc => (
                        <option key={loc._id} value={loc._id}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="md:col-span-2">
                  <button type="submit" className="w-full bg-coral text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-coral/20">Create account</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <input
            type="text"
            className="w-full bg-white border border-slate-200 rounded-3xl py-4 px-12 text-sm font-bold text-ink shadow-sm focus:ring-4 focus:ring-coral/5 transition-all outline-none"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-4 text-ink/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 flex justify-center"><div className="h-10 w-10 animate-spin rounded-full border-[6px] border-coral border-t-transparent" /></div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div key={user._id} className="group rounded-[36px] bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-[28px] bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center border border-slate-200 group-hover:scale-105 transition-transform">
                      {user.avatarUrl ? (
                         <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover rounded-[28px]" />
                      ) : (
                        <span className="text-2xl font-black text-ink/10">{user.name?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-display text-2xl font-black text-ink tracking-tight">{user.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${user.role === 'superadmin' ? 'bg-ink text-white' : user.role === 'admin' ? 'bg-coral/10 text-coral' : 'bg-slate-100 text-ink/40'}`}>
                          {user.role}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm font-bold text-ink/50">
                        <span className="flex items-center gap-2"><svg className="h-4 w-4 text-coral/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>{user.email}</span>
                        {user.phone && <span className="flex items-center gap-2"><svg className="h-4 w-4 text-coral/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>{user.phone}</span>}
                      </div>
                    </div>
                  </div>

                    <div className="flex items-center gap-4 border-t md:border-t-0 pt-6 md:pt-0 border-slate-100">
                      {canEdit && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-black text-ink/20 uppercase tracking-widest px-1">Control access</label>
                          <select
                            className="rounded-2xl bg-slate-50 border border-slate-200 px-5 py-3 text-xs font-black uppercase tracking-wider text-ink focus:ring-4 focus:ring-coral/5 outline-none cursor-pointer transition-all"
                            value={user.role}
                            onChange={(event) => updateRole(user._id, event.target.value)}
                          >
                            <option value="customer">Customer</option>
                            <option value="trainer">Trainer</option>
                            <option value="admin">Admin</option>
                            <option value="superadmin">Superadmin</option>
                            {customRoles.map(r => (
                              <option key={r._id} value={r.name}>{r.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <button 
                        onClick={() => {
                          const next = expandedUser === user._id ? null : user._id;
                          setExpandedUser(next);
                          if (next) fetchChildren(user._id);
                        }}
                        className={`h-14 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${expandedUser === user._id ? 'bg-coral text-white' : 'bg-slate-50 text-ink/40 hover:bg-slate-100'}`}
                      >
                        {expandedUser === user._id ? 'Close info' : 'View full profile'}
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => deleteUser(user._id)}
                          className="h-14 w-14 flex items-center justify-center rounded-2xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-sm"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                </div>

                {expandedUser === user._id && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-8 space-y-10 animate-in fade-in duration-500">
                    <div className="grid md:grid-cols-3 gap-12">
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-ink/20 uppercase tracking-[0.2em]">Contact Details</h4>
                        <div className="space-y-4">
                           <div className="flex flex-col"><span className="text-[10px] font-black text-ink/30 uppercase tracking-widest">Address</span><span className="text-xs font-bold text-ink mt-1">{user.address || 'Not provided'}</span></div>
                           <div className="flex flex-col"><span className="text-[10px] font-black text-ink/30 uppercase tracking-widest">Location</span><span className="text-xs font-bold text-ink mt-1">{user.city}, {user.country}</span></div>
                           <div className="flex flex-col"><span className="text-[10px] font-black text-ink/30 uppercase tracking-widest">Joined On</span><span className="text-xs font-bold text-ink mt-1">{new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-ink/20 uppercase tracking-[0.2em]">Children ({userChildren[user._id]?.length || 0})</h4>
                        <div className="flex flex-wrap gap-2">
                          {userChildren[user._id]?.map(child => (
                            <div key={child._id} className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-ink/70">
                              {child.name} <span className="text-[10px] text-ink/20 ml-2">({child.age} yrs)</span>
                            </div>
                          ))}
                          {(!userChildren[user._id] || userChildren[user._id].length === 0) && <p className="text-xs text-ink/20 italic">No children linked</p>}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-ink/20 uppercase tracking-[0.2em]">Active Permissions</h4>
                        <div className="space-y-2">
                          {user.role === 'superadmin' ? (
                            <span className="inline-block bg-ink text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">Full Platform Access</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                               {customRoles.find(r => r.name === user.role)?.permissions?.map(p => (
                                 <span key={p} className="bg-white border border-slate-200 text-ink/40 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter">
                                   {p}
                                 </span>
                               )) || <span className="text-xs text-ink/20">No role-based permissions</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
              <p className="text-ink/20 font-bold italic tracking-wide">No users matching your criteria.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
