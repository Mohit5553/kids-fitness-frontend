import { useEffect, useState, useMemo } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';
import toast from 'react-hot-toast';
import { usePermissions } from '../../hooks/usePermissions.js';
import { useBranch } from '../../context/BranchContext.jsx';

const emptyForm = {
  classId: '',
  trainerId: '',
  startTime: '',
  endTime: '',
  capacity: '',
  location: '',
  status: 'scheduled'
};

export default function SessionsManagement() {
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('active'); // 'active' or 'expired'
  const [classSearchQuery, setClassSearchQuery] = useState('');
  const [showClassDropdown, setShowClassDropdown] = useState(false);

  const { can } = usePermissions();
  const { selectedBranch } = useBranch();

  const canCreate = can('sessions:create');
  const canEdit = can('sessions:edit');
  const canDelete = can('sessions:delete');

  const load = () => {
    setLoading(true);
    const p1 = api.get('/sessions').then((res) => {
      const data = res.data || [];
      // Sort latest date first
      const sorted = data.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
      setSessions(sorted);
    });
    const p2 = api.get('/classes').then((res) => setClasses(res.data || []));
    const p3 = api.get('/trainers').then((res) => setTrainers(res.data || []));
    const p4 = api.get('/locations').then((res) => setLocations(res.data || []));
    Promise.all([p1, p2, p3, p4]).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Autofill capacity if class is selected and capacity is empty
      if (name === 'classId' && value && !prev.capacity) {
        const cls = classes.find(c => c._id === value);
        if (cls) {
          updated.capacity = cls.capacity || '';
          if (cls.locationId) updated.locationId = cls.locationId?._id || cls.locationId;
        }
      }
      return updated;
    });
  };

  const filteredTrainers = useMemo(() => {
    if (!form.classId) return trainers;
    const selectedClass = classes.find(c => c._id === form.classId);
    if (!selectedClass || !selectedClass.availableTrainers) return trainers;
    const availableIds = selectedClass.availableTrainers.map(t => t._id || t);
    return trainers.filter(t => availableIds.includes(t._id));
  }, [form.classId, classes, trainers]);

  const handleEdit = (session) => {
    setEditingId(session._id);
    setForm({
      classId: session.classId?._id || session.classId || '',
      trainerId: session.trainerId?._id || session.trainerId || '',
      locationId: session.locationId?._id || session.locationId || '',
      startTime: session.startTime ? new Date(session.startTime).toISOString().slice(0, 16) : '',
      endTime: session.endTime ? new Date(session.endTime).toISOString().slice(0, 16) : '',
      capacity: session.capacity ?? '',
      location: session.location || '',
      status: session.status || 'scheduled'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId('');
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.classId) {
      return toast.error('Please select a class from the search results');
    }

    if (!selectedBranch || selectedBranch === 'all') {
      return toast.error('Please select a specific branch in the header to create a session');
    }

    const payload = {
      ...form,
      startTime: new Date(form.startTime).toISOString(),
      endTime: form.endTime ? new Date(form.endTime).toISOString() : undefined,
      capacity: form.capacity ? Number(form.capacity) : undefined
    };

    console.log('Creating session with payload:', {
      ...payload,
      locationIds: [selectedBranch]
    });

    try {
      if (editingId) {
        await api.put(`/sessions/${editingId}`, payload);
      } else {
        // If superadmin has "all" selected, the backend will fail with "Location is required" 
        // unless the class has one. We've added a UI warning below.
        await api.post('/sessions', {
          ...payload,
          locationIds: selectedBranch && selectedBranch !== 'all' ? [selectedBranch] : []
        });
      }
      toast.success(editingId ? 'Session updated successfully!' : 'Session created successfully!');
      handleCancel();
      load();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save session';
      console.error('Session save error:', err.response?.data);
      toast.error(msg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this session? Existing bookings may be affected.')) return;
    try {
      await api.delete(`/sessions/${id}`);
      toast.success('Session deleted');
      load();
    } catch (err) {
      toast.error('Failed to delete session');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="page-shell flex-1 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-black text-ink">Session Manager</h1>
            <p className="mt-1 text-ink/50 font-medium">Schedule specific time slots for trainers and classes.</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-xs font-black uppercase tracking-widest text-ink/60">{sessions.filter(s => new Date(s.startTime) >= new Date()).length} Active Slots</span>
            </div>
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
              <button
                type="button"
                onClick={() => setView('active')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'active' ? 'bg-brand-blue text-white shadow-md' : 'text-ink/30 hover:text-ink'}`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setView('expired')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'expired' ? 'bg-brand-blue text-white shadow-md' : 'text-ink/30 hover:text-ink'}`}
              >
                Expired / Closed
              </button>
            </div>
          </div>
        </div>

        {canCreate || (editingId && canEdit) ? (
          <div className="soft-card rounded-[48px] p-8 md:p-10 mb-10">
            <form className="grid gap-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-ink/30 ml-4">Class Path</label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
                    placeholder="Search and select class..."
                    value={classSearchQuery || (classes.find(c => c._id === form.classId)?.title || '')}
                    onChange={(e) => {
                      setClassSearchQuery(e.target.value);
                      if (!showClassDropdown) setShowClassDropdown(true);
                      // Clear selection if searching
                      if (form.classId) setForm(prev => ({ ...prev, classId: '' }));
                    }}
                    onFocus={() => setShowClassDropdown(true)}
                  />
                  {showClassDropdown && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-[300px] overflow-y-auto overflow-x-hidden p-2 animate-in fade-in zoom-in-95 duration-200">
                      {classes
                        .filter(c => !classSearchQuery || c.title?.toLowerCase().includes(classSearchQuery.toLowerCase()))
                        .map((item) => (
                          <button
                            key={item._id}
                            type="button"
                            onClick={() => {
                              setForm(prev => ({ 
                                ...prev, 
                                classId: item._id,
                                capacity: prev.capacity || item.capacity || ''
                              }));
                              setClassSearchQuery(item.title);
                              setShowClassDropdown(false);
                            }}
                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 transition-all group"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-black text-ink group-hover:text-brand-blue">{item.title}</span>
                              <span className="text-[10px] font-bold text-ink/20">{item.ageGroup}</span>
                            </div>
                          </button>
                        ))
                      }
                      {classes.filter(c => !classSearchQuery || c.title?.toLowerCase().includes(classSearchQuery.toLowerCase())).length === 0 && (
                        <div className="p-4 text-center">
                          <p className="text-xs font-bold text-ink/30 italic">No classes found matching "{classSearchQuery}"</p>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Backdrop to close dropdown */}
                  {showClassDropdown && (
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => {
                        setShowClassDropdown(false);
                        setClassSearchQuery(''); // Reset query on close
                      }}
                    />
                  )}
                </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-ink/30 ml-4">Assigned Trainer</label>
                  <select
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
                    name="trainerId"
                    value={form.trainerId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select trainer</option>
                    {filteredTrainers.map((trainer) => (
                      <option key={trainer._id} value={trainer._id}>{trainer.name}</option>
                    ))}
                  </select>
                  {form.classId && filteredTrainers.length === 0 && (
                    <p className="text-[10px] text-coral font-bold mt-1 ml-4 italic">No trainers linked to this class!</p>
                  )}
                </div>
              </div>

              {selectedBranch === 'all' && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 animate-pulse">
                  <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-xs font-bold text-amber-700">
                    "All locations" is selected in the header. Please select a specific branch (e.g. Dubai Al Wasl) in the top switcher to create a session.
                  </p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-ink/30 ml-4">Start Time & Date</label>
                  <input
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
                    name="startTime"
                    type="datetime-local"
                    value={form.startTime}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-ink/30 ml-4">End Time (Optional)</label>
                  <input
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
                    name="endTime"
                    type="datetime-local"
                    value={form.endTime}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-ink/30 ml-4">Slot Capacity</label>
                  <input
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
                    name="capacity"
                    type="number"
                    placeholder="Inherits from class"
                    value={form.capacity}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-ink/30 ml-4">Studio / Room Name (Optional)</label>
                  <input
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
                    name="location"
                    placeholder="Studio A, etc."
                    value={form.location}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button 
                  className={`bg-brand-blue text-white px-10 py-4 rounded-full font-black shadow-lg transition-all ${selectedBranch === 'all' && !editingId ? 'opacity-50 cursor-not-allowed hover:scale-100' : 'hover:scale-105 active:scale-95'}`} 
                  type="submit"
                  disabled={selectedBranch === 'all' && !editingId}
                >
                  {editingId ? 'Update Session' : 'Create Session'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="text-sm font-bold text-ink/40 hover:text-ink transition-all px-6"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        ) : (
          <div className="soft-card rounded-[48px] p-8 md:p-10 mb-10 bg-white/50 border border-dashed border-slate-200 text-center">
            <p className="text-sm font-bold text-ink/30 italic">You don't have permission to {editingId ? 'edit' : 'create'} sessions.</p>
          </div>
        )}

        <div className="grid gap-4">
          {sessions.filter(s => view === 'active' ? new Date(s.startTime) >= new Date() : new Date(s.startTime) < new Date()).length > 0 ?
            sessions.filter(s => view === 'active' ? new Date(s.startTime) >= new Date() : new Date(s.startTime) < new Date()).map((session) => (
              <div key={session._id} className={`soft-card rounded-[32px] p-6 hover:shadow-xl transition-all group flex flex-col md:flex-row items-center justify-between gap-6 border ${new Date(session.startTime) < new Date() ? 'bg-slate-50/50 border-slate-200/50' : 'border-slate-100/50'}`}>
                <div className="flex items-center gap-6 flex-1">
                  <div className={`w-16 h-16 rounded-[24px] flex flex-col items-center justify-center ${new Date(session.startTime) < new Date() ? 'bg-slate-200/50 text-ink/20' : 'bg-brand-blue/5 text-brand-blue'}`}>
                    <span className="text-[10px] font-black uppercase tracking-tighter">{new Date(session.startTime).toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-xl font-black leading-none">{new Date(session.startTime).getDate()}</span>
                  </div>
                  <div>
                    <h3 className={`font-display text-xl ${new Date(session.startTime) < new Date() ? 'text-ink/30' : 'text-ink'}`}>{session.classId?.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      <p className="text-xs font-bold text-ink/60 flex items-center gap-1.5 leading-none">
                        <span className={`w-1.5 h-1.5 rounded-full ${new Date(session.startTime) < new Date() ? 'bg-slate-300' : 'bg-ocean'}`}></span>
                        {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {session.endTime && (
                          <span className="text-ink/30 ml-1">
                            - {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </p>
                      <p className="text-xs font-bold text-ink/40">Trainer: <span className={new Date(session.startTime) < new Date() ? 'text-ink/20' : 'text-brand-blue'}>{session.trainerId?.name || 'TBA'}</span></p>
                      <p className="text-xs font-bold text-ink/40">Occupancy: <span className={session.bookedParticipants >= session.capacity ? 'text-coral' : 'text-green-500'}>{session.bookedParticipants || 0} / {session.capacity}</span></p>
                    </div>
                    <div className="mt-2 text-[10px] font-black uppercase tracking-widest">
                      {new Date(session.startTime) < new Date() ? (
                        <span className="text-ink/30 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                          Closed / Expired
                        </span>
                      ) : (
                        <span className="text-moss bg-moss/10 px-3 py-1 rounded-full border border-moss/20">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {canEdit && (
                    <button
                      className={`rounded-full px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${new Date(session.startTime) < new Date()
                          ? 'bg-white border border-slate-200 text-ink/40 hover:bg-slate-50'
                          : 'bg-brand-blue text-white hover:bg-brand-blue/90 shadow-md shadow-brand-blue/10'
                        }`}
                      onClick={() => handleEdit(session)}
                    >
                      Edit
                    </button>
                  )}
                  {canDelete && new Date(session.startTime) < new Date() && (
                    <button
                      className="h-10 w-10 flex items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                      onClick={() => handleDelete(session._id)}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
              </div>
            )) : (
              <div className="py-20 text-center bg-white rounded-[48px] border border-dashed border-slate-200">
                <p className="font-display text-xl text-ink/30 italic font-black">No {view} sessions found.</p>
              </div>
            )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

