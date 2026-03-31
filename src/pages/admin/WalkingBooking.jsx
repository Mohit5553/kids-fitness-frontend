import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api.js';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import AdminHeader from '../../components/AdminHeader.jsx';
import { getUser } from '../../utils/auth.js';
import { toast } from 'react-hot-toast';

export default function WalkingBooking() {
  const { roleSlug } = useParams();
  const navigate = useNavigate();
  const staff = getUser();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Customer Data
  const [searchQuery, setSearchQuery] = useState('');
  const [customer, setCustomer] = useState(null); // { _id, name, email, phone }
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' });

  // Step 2: Children Data
  const [availableChildren, setAvailableChildren] = useState([]);
  const [selectedChildrenIds, setSelectedChildrenIds] = useState([]);
  const [newChildren, setNewChildren] = useState([]); // [{ name, age, gender }]

  // Step 3: Class Data
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);

  // Step 4: Location & Trainer
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(staff?.locationIds?.[0]?._id || staff?.locationIds?.[0] || '');
  const [trainers, setTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');

  // Step 5: Sessions
  const [sessions, setSessions] = useState([]);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [selectedDateFilter, setSelectedDateFilter] = useState('');

  // Step 6: Success
  const [createdBookings, setCreatedBookings] = useState([]);

  // Fetch initial data
  useEffect(() => {
    api.get('/classes')
      .then(res => setClasses(res.data))
      .catch(err => console.error(err));

    api.get('/locations?activeClasses=true')
      .then(res => setLocations(res.data))
      .catch(err => console.error(err));
  }, []);

  // Handle User Lookup
  const handleLookup = async () => {
    if (!searchQuery) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/users/lookup?query=${searchQuery}`);
      setCustomer(res.data.user);
      setAvailableChildren(res.data.children || []);
      setSelectedChildrenIds([]);
      setStep(2);
      toast.success('Customer found');
    } catch (err) {
      if (err.response?.status === 404) {
        setCustomer(null);
        setNewCustomer({ ...newCustomer, [searchQuery.includes('@') ? 'email' : 'phone']: searchQuery });
        setStep(1.5); // "Register New Customer" step
      } else {
        setError('Search failed. Please try again.');
        toast.error('Search failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 1.5 -> Step 2
  const handleRegisterCustomer = () => {
    if (!newCustomer.name || (!newCustomer.email && !newCustomer.phone)) {
      setError('Name and either Email or Phone are required');
      return;
    }
    setError('');
    setStep(2);
  };

  // Step 2 logic: Managing children
  const addChildRow = () => {
    setNewChildren([...newChildren, { name: '', age: '', gender: 'male' }]);
  };

  const removeChildRow = (idx) => {
    setNewChildren(newChildren.filter((_, i) => i !== idx));
  };

  const updateChildRow = (idx, field, value) => {
    const updated = [...newChildren];
    updated[idx][field] = value;
    setNewChildren(updated);
  };

  const toggleExistingChild = (id) => {
    if (selectedChildrenIds.includes(id)) {
      setSelectedChildrenIds(selectedChildrenIds.filter(i => i !== id));
    } else {
      setSelectedChildrenIds([...selectedChildrenIds, id]);
    }
  };

  // Step 3 -> 4: Trainers Filtering
  useEffect(() => {
    if (selectedClass && selectedLocation) {
      const classTrainers = selectedClass.availableTrainers || [];
      const filtered = classTrainers.filter(t => {
        const tLocs = t.locationIds || [];
        return tLocs.some(loc => (loc._id || loc) === selectedLocation);
      });
      setTrainers(filtered);
    }
  }, [selectedClass, selectedLocation]);

  // Step 4 -> 5: Sessions Fetching
  useEffect(() => {
    if (selectedClass && selectedTrainer && selectedLocation) {
      setLoading(true);
      api.get(`/sessions?classId=${selectedClass._id}&trainerId=${selectedTrainer}&locationId=${selectedLocation}&start=${new Date().toISOString()}`)
        .then(res => {
          setSessions(res.data);
          const groups = Array.from(new Set(res.data.map(s =>
            new Date(s.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
          )));
          if (groups.length > 0) setSelectedDateFilter(groups[0]);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [selectedClass, selectedTrainer, selectedLocation]);

  const sessionGroups = useMemo(() => {
    const groups = {};
    sessions.forEach(s => {
      const dateKey = new Date(s.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(s);
    });
    return groups;
  }, [sessions]);

  const dateKeys = Object.keys(sessionGroups);

  const handleFinalBooking = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Create/Sync Walking Customer and Children
      const walkingPayload = {
        name: customer?.name || newCustomer.name,
        email: customer?.email || newCustomer.email,
        phone: customer?.phone || newCustomer.phone,
        children: newChildren
      };

      const userRes = await api.post('/users/walking', walkingPayload);
      const finalUser = userRes.data.user;
      const finalChildren = userRes.data.children;

      // Map selected participants
      const participants = [];
      // Add existing selected children
      selectedChildrenIds.forEach(id => {
        const c = (availableChildren || []).find(ac => ac._id === id);
        if (c) participants.push({ name: c.name, age: c.age, gender: c.gender, childId: c._id });
      });
      // Add newly created children
      newChildren.forEach(nc => {
        const match = (finalChildren || []).find(fc => fc.name === nc.name && fc.age === Number(nc.age));
        if (match) participants.push({ name: match.name, age: match.age, gender: match.gender, childId: match._id });
      });

      if (participants.length === 0) {
        throw new Error('Please select or add at least one child/participant');
      }

      // 2. Create Bookings
      const results = [];
      for (const sess of selectedSessions) {
        const payload = {
          participants,
          classId: selectedClass._id,
          sessionId: sess._id,
          locationId: selectedLocation,
          date: sess.startTime,
          paymentMethod: 'center_cash',
          paymentStatus: 'completed', // Staff marking as paid at desk
          userId: finalUser._id
        };
        const res = await api.post('/bookings', payload);
        results.push(res.data);
      }

      setCreatedBookings(results);
      setStep(7); // Success
      toast.success('Walking booking completed!');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Booking failed');
      toast.error('Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="page-shell flex-1 py-12">
        <AdminHeader 
          title="Walking Customer Booking" 
          description="Directly register and book for walk-in customers at the center."
          backTo={`/${roleSlug}`}
        />

        <div className="mt-8 max-w-4xl mx-auto">
          {/* Progress Indicator */}
          <div className="flex justify-between mb-12 px-4 relative">
             <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 -translate-y-1/2 rounded-full"></div>
             <div className="absolute top-1/2 left-0 h-1 bg-brand-blue -z-10 -translate-y-1/2 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 6) * 100}%` }}></div>
            {[1, 2, 3, 4, 5, 6].map(s => (
              <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step >= s ? 'bg-brand-blue text-white shadow-glow' : 'bg-white text-ink/30 border-2 border-slate-200'}`}>
                {s}
              </div>
            ))}
          </div>

          <div className="soft-card rounded-[40px] p-8 md:p-12 relative overflow-hidden">
            {loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
                  <p className="font-black text-brand-blue animate-pulse">Syncing...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 flex items-center animate-rise">
                <span className="mr-2">⚠️</span> {error}
              </div>
            )}

            {/* STEP 1: CUSTOMER LOOKUP */}
            {step === 1 && (
              <div className="animate-rise">
                <h2 className="font-display text-3xl font-black text-ink mb-2">Identify Customer</h2>
                <p className="text-ink/60 mb-8">Search by Email or Phone to find an existing account.</p>
                
                <div className="flex flex-col md:flex-row gap-4">
                  <input 
                    type="text" 
                    placeholder="Email or Phone number"
                    className="flex-1 bg-slate-50 border-none rounded-2xl py-5 px-8 text-lg font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  />
                  <button onClick={handleLookup} className="bg-brand-blue text-white px-10 py-5 rounded-2xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all text-lg">Find Customer</button>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col items-center">
                  <p className="text-sm font-bold text-ink/40 mb-4">Or if this is their first visit:</p>
                  <button onClick={() => setStep(1.5)} className="bg-white border-2 border-slate-100 text-ink px-8 py-3 rounded-xl font-bold hover:border-brand-blue transition-all">Register New Customer</button>
                </div>
              </div>
            )}

            {/* STEP 1.5: NEW CUSTOMER FORM */}
            {step === 1.5 && (
              <div className="animate-rise">
                <h2 className="font-display text-3xl font-black text-ink mb-6">New Walking Customer</h2>
                <div className="grid gap-8">
                  <div>
                    <label className="block text-xs font-black text-ink/40 uppercase tracking-[0.2em] mb-3 px-1">Customer Full Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-black text-ink/40 uppercase tracking-[0.2em] mb-3 px-1">Email Address</label>
                      <input 
                        type="email" 
                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none"
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-ink/40 uppercase tracking-[0.2em] mb-3 px-1">Phone Number</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none"
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                        placeholder="+971 50 XXXXXXX"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-12 flex justify-between items-center">
                  <button onClick={() => setStep(1)} className="text-sm font-bold text-ink/40 hover:text-ink px-6">Back to search</button>
                  <button onClick={handleRegisterCustomer} className="bg-brand-blue text-white px-10 py-4 rounded-full font-black shadow-lg hover:scale-105 active:scale-95 transition-all">Proceed to Participants</button>
                </div>
              </div>
            )}

            {/* STEP 2: PARTICIPANTS (CHILDREN) */}
            {step === 2 && (
              <div className="animate-rise">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="font-display text-3xl font-black text-ink">Participants</h2>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-brand-blue tracking-widest">Customer</p>
                        <p className="font-bold text-ink">{customer?.name || newCustomer.name}</p>
                    </div>
                </div>

                <div className="space-y-10">
                  {/* Existing Children */}
                  {availableChildren.length > 0 && (
                    <div className="animate-rise">
                      <label className="block text-xs font-black text-ink/40 uppercase tracking-[0.2em] mb-4 px-1">Registered Children</label>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {availableChildren.map(child => (
                          <button
                            key={child._id}
                            onClick={() => toggleExistingChild(child._id)}
                            className={`p-6 rounded-[24px] border-2 transition-all text-left flex items-center justify-between group ${selectedChildrenIds.includes(child._id) ? 'border-brand-blue bg-brand-blue/5 text-brand-blue shadow-md' : 'border-slate-100 bg-white hover:border-slate-300'}`}
                          >
                            <div>
                                <p className="font-black text-lg">{child.name}</p>
                                <p className="text-xs font-bold opacity-60 mt-1">{child.age} Years • {child.gender}</p>
                            </div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${selectedChildrenIds.includes(child._id) ? 'bg-brand-blue text-white' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                                {selectedChildrenIds.includes(child._id) ? '✓' : ''}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Children Section */}
                  <div className="animate-rise">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <label className="block text-xs font-black text-ink/40 uppercase tracking-[0.2em]">Add New Members</label>
                        <button onClick={addChildRow} className="text-xs font-black text-brand-blue bg-brand-blue/5 px-5 py-2.5 rounded-xl hover:bg-brand-blue/10 transition-all border border-brand-blue/10">+ New Row</button>
                    </div>
                    
                    <div className="space-y-4">
                    {newChildren.map((nc, idx) => (
                      <div key={idx} className="p-6 rounded-[28px] bg-white border border-slate-100 shadow-sm relative group animate-rise">
                        <button onClick={() => removeChildRow(idx)} className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white text-red-400 hover:text-white hover:bg-red-500 shadow-md flex items-center justify-center transition-all border border-slate-50">×</button>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase text-ink/30 ml-2">Name</span>
                                <input 
                                    type="text" placeholder="Child Name" 
                                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-5 text-sm font-bold placeholder:text-ink/20"
                                    value={nc.name} onChange={(e) => updateChildRow(idx, 'name', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase text-ink/30 ml-2">Age</span>
                                <input 
                                    type="number" placeholder="Age" 
                                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-5 text-sm font-bold"
                                    value={nc.age} onChange={(e) => updateChildRow(idx, 'age', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase text-ink/30 ml-2">Gender</span>
                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                    {['male', 'female'].map(g => (
                                        <button 
                                            key={g}
                                            onClick={() => updateChildRow(idx, 'gender', g)}
                                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${nc.gender === g ? 'bg-white text-brand-blue shadow-sm' : 'text-ink/30 hover:text-ink/50'}`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                      </div>
                    ))}
                    {newChildren.length === 0 && availableChildren.length === 0 && (
                        <div className="py-12 border-2 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center">
                            <p className="text-ink/20 font-bold mb-4">No participants added</p>
                            <button onClick={addChildRow} className="bg-brand-blue/5 text-brand-blue px-8 py-3 rounded-full font-black text-sm">Add First Child</button>
                        </div>
                    )}
                    </div>
                  </div>
                </div>

                <div className="mt-16 flex justify-between items-center">
                  <button onClick={() => setStep(customer ? 1 : 1.5)} className="text-sm font-bold text-ink/40 hover:text-ink px-6">Back</button>
                  <button 
                    onClick={() => setStep(3)} 
                    disabled={selectedChildrenIds.length === 0 && newChildren.length === 0}
                    className="bg-brand-blue text-white px-12 py-4 rounded-full font-black shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    Next: Select Program
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CLASS SELECTION */}
            {step === 3 && (
              <div className="animate-rise">
                <h2 className="font-display text-3xl font-black text-ink mb-8">Select Program</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {classes.map(c => (
                    <button
                      key={c._id}
                      onClick={() => { setSelectedClass(c); setStep(4); }}
                      className={`p-8 rounded-[36px] border-2 transition-all bg-white text-left group flex flex-col justify-between h-full ${selectedClass?._id === c._id ? 'border-brand-blue shadow-xl bg-brand-blue/5' : 'border-slate-50 hover:border-brand-blue/30 shadow-sm'}`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                            <span className="bg-ocean/10 text-ocean text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">{c.ageGroup}</span>
                            {selectedClass?._id === c._id && <span className="text-brand-blue">✓</span>}
                        </div>
                        <h3 className="font-display text-2xl group-hover:text-brand-blue transition-colors leading-tight">{c.title}</h3>
                        <p className="mt-3 text-sm text-ink/50 line-clamp-2 leading-relaxed">{c.description}</p>
                      </div>
                      <div className="mt-8 flex items-baseline gap-2">
                        <span className="text-3xl font-black text-ink">AED {c.price}</span>
                        <span className="text-xs font-bold text-ink/30 uppercase">/ session</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-12 flex items-center justify-between">
                  <button onClick={() => setStep(2)} className="text-sm font-bold text-ink/40 hover:text-ink px-6">Back to participants</button>
                </div>
              </div>
            )}

            {/* STEP 4: LOCATION & TRAINER */}
            {step === 4 && (
              <div className="animate-rise">
                <h2 className="font-display text-3xl font-black text-ink mb-8">Branch & Trainer</h2>
                
                <div className="space-y-12">
                  <div className="p-8 rounded-[32px] bg-slate-50">
                    <label className="block text-xs font-black text-ink/40 uppercase tracking-[0.2em] mb-4 px-1">Branch Location</label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {locations.map(loc => (
                         <button 
                            key={loc._id}
                            onClick={() => { setSelectedLocation(loc._id); setSelectedTrainer(''); }}
                            className={`p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${selectedLocation === loc._id ? 'border-brand-blue bg-white shadow-md' : 'bg-white border-transparent hover:border-slate-200 opacity-60 hover:opacity-100'}`}
                         >
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl">📍</div>
                            <div className="text-left leading-none">
                                <p className="font-black text-sm">{loc.name}</p>
                                <p className="text-[10px] text-ink/40 mt-1 uppercase font-bold">{loc.city || 'UAE'}</p>
                            </div>
                         </button>
                      ))}
                    </div>
                  </div>

                  {selectedLocation && (
                  <div className="animate-rise">
                    <label className="block text-xs font-black text-ink/40 uppercase tracking-[0.2em] mb-4 px-1">Choose Assigned Trainer</label>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                       {trainers.map(t => (
                         <button
                            key={t._id}
                            onClick={() => { setSelectedTrainer(t._id); setStep(5); }}
                            className={`p-5 rounded-[24px] border-2 transition-all flex items-center gap-4 group ${selectedTrainer === t._id ? 'border-brand-blue bg-white shadow-glow' : 'bg-white border-slate-50 hover:border-brand-blue/20'}`}
                         >
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl overflow-hidden shrink-0 group-hover:scale-105 transition-all">
                                {t.avatarUrl ? <img src={t.avatarUrl.startsWith('http') ? t.avatarUrl : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}${t.avatarUrl}`} className="h-full w-full object-cover" /> : '🏆'}
                            </div>
                            <div className="text-left overflow-hidden">
                                <p className="font-black text-base text-ink truncate">{t.name}</p>
                                <p className="text-[10px] text-brand-blue uppercase font-black tracking-widest mt-0.5">{t.specialties?.[0] || 'Fitness Coach'}</p>
                            </div>
                         </button>
                       ))}
                       {trainers.length === 0 && (
                          <div className="col-span-full py-10 bg-coral/5 rounded-[32px] border border-coral/10 text-center">
                             <p className="text-coral font-black text-sm">No trainers assigned to this program at this branch.</p>
                             <p className="text-xs text-coral/60 mt-1">Please check trainer profile locations.</p>
                          </div>
                       )}
                    </div>
                  </div>
                  )}
                </div>
                <div className="mt-16 flex items-center justify-between">
                   <button onClick={() => setStep(3)} className="text-sm font-bold text-ink/40 hover:text-ink px-6">Back to programs</button>
                </div>
              </div>
            )}

            {/* STEP 5: SESSIONS */}
            {step === 5 && (
               <div className="animate-rise">
                  <h2 className="font-display text-3xl font-black text-ink mb-2">Available Slots</h2>
                  <p className="text-ink/60 mb-8">{selectedClass?.title} with {trainers.find(t=>t._id === selectedTrainer)?.name}</p>
                  
                  {dateKeys.length > 0 ? (
                    <div>
                       <div className="flex gap-3 overflow-x-auto pb-4 mb-8 scrollbar-hide snap-x">
                         {dateKeys.map(dk => (
                           <button
                             key={dk}
                             onClick={() => setSelectedDateFilter(dk)}
                             className={`px-8 py-4 rounded-full text-xs font-black uppercase tracking-[0.15em] transition-all border-2 shrink-0 snap-start ${selectedDateFilter === dk ? 'bg-brand-blue text-white border-brand-blue shadow-lg' : 'bg-white text-ink/40 border-slate-100 hover:border-brand-blue/30'}`}
                           >
                             {dk}
                           </button>
                         ))}
                       </div>

                       <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 animate-rise">
                          {(sessionGroups[selectedDateFilter] || []).map(s => {
                            const isSel = selectedSessions.find(sess => sess._id === s._id);
                            const left = s.capacity - (s.bookedParticipants || 0);
                            return (
                               <button
                                 key={s._id}
                                 onClick={() => {
                                    if (left <= 0 && !isSel) return;
                                    if (isSel) setSelectedSessions(selectedSessions.filter(ss => ss._id !== s._id));
                                    else setSelectedSessions([...selectedSessions, s]);
                                 }}
                                 disabled={left <= 0 && !isSel}
                                 className={`p-6 rounded-[32px] border-2 transition-all flex flex-col items-center justify-center gap-1 group ${isSel ? 'border-brand-blue bg-brand-blue/5 text-ink shadow-md' : left <= 0 ? 'bg-slate-50/50 border-slate-100 opacity-50 cursor-not-allowed text-ink/20' : 'bg-white border-slate-50 hover:border-brand-blue/20'}`}
                               >
                                 <span className="text-2xl font-black font-display">{new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                 <div className="flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${left > 2 ? 'bg-green-400' : left <= 0 ? 'bg-slate-200' : 'bg-coral'}`}></div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${left <= 0 ? 'text-coral' : 'opacity-40'}`}>{left <= 0 ? 'FULL' : `${left} left`}</span>
                                 </div>
                               </button>
                            );
                          })}
                       </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[40px]">
                        <p className="text-ink/30 font-bold italic">No upcoming sessions found for this coach.</p>
                        <button onClick={() => setStep(4)} className="mt-4 text-brand-blue font-black underline underline-offset-4">Try another trainer</button>
                    </div>
                  )}

                  <div className="mt-16 flex justify-between items-center">
                    <button onClick={() => setStep(4)} className="text-sm font-bold text-ink/40 hover:text-ink px-6">Back</button>
                    <button 
                      onClick={() => setStep(6)} 
                      disabled={selectedSessions.length === 0}
                      className="bg-brand-blue text-white px-12 py-4 rounded-full font-black shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                      Process Final Review ({selectedSessions.length})
                    </button>
                  </div>
               </div>
            )}

            {/* STEP 6: SUMMARY & PAYMENT */}
            {step === 6 && (
               <div className="animate-rise">
                  <div className="text-center mb-10">
                    <h2 className="font-display text-4xl font-black text-ink mb-2">Final Confirmation</h2>
                    <p className="text-sm font-black text-brand-blue uppercase tracking-[0.3em]">Verify Details & Payments</p>
                  </div>
                  
                  <div className="grid gap-10 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="soft-card !bg-slate-50 rounded-[40px] p-8 border-none flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-ink/30 mb-2">Program Details</p>
                                <h3 className="font-display text-3xl font-black text-ink mb-2">{selectedClass.title}</h3>
                                <p className="text-sm font-bold text-ocean flex items-center gap-2">
                                    📍 {locations.find(l=>l._id === selectedLocation)?.name}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-4xl font-black text-ink">AED {selectedClass.price * (selectedChildrenIds.length + newChildren.length) * selectedSessions.length}</p>
                                <p className="text-[10px] font-black text-ink/30 uppercase tracking-widest mt-1">Total inclusive order</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-white p-8 rounded-[36px] border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-widest text-ink/30 mb-4">Participants ({selectedChildrenIds.length + newChildren.length})</p>
                                <div className="space-y-3">
                                    {[...selectedChildrenIds.map(id => availableChildren.find(c=>c._id===id)), ...newChildren].map((p, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm">
                                            <span className="font-black text-ink">{p.name}</span>
                                            <span className="text-ink/40 font-bold">{p.age} Yrs</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-[36px] border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-widest text-ink/30 mb-4">Schedule ({selectedSessions.length})</p>
                                <div className="space-y-3">
                                    {selectedSessions.map((s, i) => (
                                        <div key={i} className="text-xs font-bold text-ink/70">
                                            {new Date(s.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} @ {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-8 rounded-[40px] bg-ink text-white shadow-xl">
                            <h4 className="text-xs font-black uppercase tracking-widest mb-6 text-white/40">Checkout Action</h4>
                            <div className="space-y-4">
                                <div className="p-5 rounded-3xl bg-white/5 border border-white/10 flex items-center gap-4">
                                    <span className="text-2xl">💸</span>
                                    <div>
                                        <p className="font-black text-sm uppercase">Collect Payment</p>
                                        <p className="text-[10px] text-white/40">Cash or Card at desk</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleFinalBooking}
                                    className="w-full bg-brand-blue text-white py-5 rounded-[24px] font-display text-xl font-black shadow-glow-blue hover:scale-105 active:scale-95 transition-all"
                                >
                                    Complete & Confirm
                                </button>
                            </div>
                            <p className="mt-8 text-[10px] text-center text-white/30 font-bold leading-relaxed">By clicking confirm, you acknowledge the payment has been collected and the booking details are accurate.</p>
                        </div>
                        <button onClick={() => setStep(5)} className="w-full py-4 text-sm font-black text-ink/30 hover:text-ink transition-colors uppercase tracking-widest">Modified selection</button>
                    </div>
                  </div>
               </div>
            )}

            {/* STEP 7: SUCCESS */}
            {step === 7 && (
              <div className="animate-rise text-center py-12">
                <div className="w-32 h-32 bg-ocean text-white rounded-[40px] flex items-center justify-center text-6xl mx-auto mb-10 shadow-glow rotate-12 transition-transform hover:scale-110">✓</div>
                <h2 className="font-display text-5xl font-black text-ink mb-4">Victory!</h2>
                <p className="text-ink/60 mb-8 max-w-sm mx-auto font-bold leading-relaxed">Walking customer booking has been confirmed and ledger updated.</p>
                
                <div className="mb-10 space-y-3 max-w-sm mx-auto animate-rise">
                    {createdBookings.map((b, i) => (
                        <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                            <span className="text-brand-blue font-black text-xs">#{b.bookingNumber}</span>
                            <button 
                                onClick={() => window.open(`/invoice/booking/${b._id}`, '_blank')}
                                className="bg-brand-blue/5 text-brand-blue px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-brand-blue/10 transition-all border border-brand-blue/10"
                            >
                                📄 Print Invoice
                            </button>
                        </div>
                    ))}
                </div>
                
                <div className="flex flex-col gap-4 max-w-xs mx-auto">
                    <button onClick={() => window.location.reload()} className="w-full bg-brand-blue text-white py-5 rounded-[24px] font-display text-lg font-black shadow-lg hover:scale-105 active:scale-95 transition-all">Start New Booking</button>
                    <button onClick={() => navigate(`/${roleSlug}/bookings`)} className="w-full bg-slate-50 text-ink/40 py-5 rounded-[24px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all text-sm">Review All Bookings</button>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
