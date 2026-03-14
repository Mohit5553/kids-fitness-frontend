import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/api.js';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { getUser } from '../utils/auth.js';
import PaymentForm from '../components/PaymentForm.jsx';

export default function BookingFlow() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const classIdFromUrl = searchParams.get('classId');
  
  const [step, setStep] = useState(1);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [trainers, setTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [participants, setParticipants] = useState([{ name: '', age: '', gender: 'male' }]);
  const [paymentType, setPaymentType] = useState(''); // 'online' or 'center'
  const [guestDetails, setGuestDetails] = useState({ name: '', email: '', phone: '' });
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Fetch Classes
  useEffect(() => {
    setLoading(true);
    api.get('/classes')
      .then(res => {
        setClasses(res.data);
        if (classIdFromUrl) {
          const found = res.data.find(c => c._id === classIdFromUrl);
          if (found) {
            setSelectedClass(found);
            setStep(2);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [classIdFromUrl]);

  // Fetch Locations
  useEffect(() => {
    api.get('/locations?activeClasses=true')
      .then(res => setLocations(res.data || []))
      .catch(() => {});
  }, []);

  // Step 3: Fetch Trainers for selected class and location
  useEffect(() => {
    if (selectedClass && selectedLocation) {
      const classTrainers = selectedClass.availableTrainers || [];
      // Filter trainers by location
      const filtered = classTrainers.filter(t => (t.locationId?._id || t.locationId) === selectedLocation);
      setTrainers(filtered);
    }
  }, [selectedClass, selectedLocation]);

  // Step 2.1: Fetch Sessions when trainer is selected
  useEffect(() => {
    if (selectedClass && selectedTrainer && selectedLocation) {
      setLoading(true);
      api.get(`/sessions?classId=${selectedClass._id}&trainerId=${selectedTrainer}&locationId=${selectedLocation}&start=${new Date().toISOString()}`)
        .then(res => {
          setSessions(res.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [selectedClass, selectedTrainer]);

  const handleNextStep = () => {
    if (step === 2 && !selectedLocation) {
      setError('Please select a branch location');
      return;
    }
    if (step === 3 && !selectedSession) {
      setError('Please select a time slot');
      return;
    }
    if (step === 4) {
      // Basic validation
      for (const p of participants) {
        if (!p.name || !p.age) {
          setError('Please fill in all participant details');
          return;
        }
        // Age validation
        const classAgeLimitStr = selectedClass.ageGroup || '';
        const limitMatch = classAgeLimitStr.match(/\d+/);
        if (limitMatch) {
          const limit = parseInt(limitMatch[0]);
          if (classAgeLimitStr.includes('>') && parseInt(p.age) <= limit) {
             setError(`${p.name} must be older than ${limit}`);
             return;
          }
           if (classAgeLimitStr.includes('+') && parseInt(p.age) < limit) {
             setError(`${p.name} must be at least ${limit} years old`);
             return;
          }
        }
      }
      // Capacity validation
      const remaining = selectedSession.capacity - (selectedSession.bookedParticipants || 0);
      if (participants.length > remaining) {
        setError(`Only ${remaining} spots left. You are trying to book ${participants.length}.`);
        return;
      }
    }
    if (step === 6 && showGuestForm) {
      if (!guestDetails.name || !guestDetails.email || !guestDetails.phone) {
        setError('Please fill in all guest details');
        return;
      }
      // Simple email validation
      if (!/\S+@\S+\.\S+/.test(guestDetails.email)) {
        setError('Please enter a valid email address');
        return;
      }
    }
    
    setError('');
    setStep(step + 1);
  };

  const handleCreateBooking = async () => {
    setLoading(true);
    try {
      const payload = {
        participants,
        classId: selectedClass._id,
        sessionId: selectedSession._id,
        locationId: selectedLocation,
        date: selectedSession.startTime,
        paymentMethod: paymentType || 'center',
        paymentStatus: paymentType === 'online' ? 'completed' : 'pending',
        guestDetails: showGuestForm ? guestDetails : undefined
      };
      await api.post('/bookings', payload);
      setStep(8); // Success step
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const addParticipant = () => {
    setParticipants([...participants, { name: '', age: '', gender: 'male' }]);
  };

  const removeParticipant = (index) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const updateParticipant = (index, field, value) => {
    const newParticipants = [...participants];
    newParticipants[index][field] = value;
    setParticipants(newParticipants);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="page-shell flex-1 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="flex justify-between mb-12 relative px-4">
             <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 -translate-y-1/2 rounded-full"></div>
             <div className="absolute top-1/2 left-0 h-1 bg-brand-blue -z-10 -translate-y-1/2 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 7) * 100}%` }}></div>
             {[1, 2, 3, 4, 5, 6, 7].map(s => (
               <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step >= s ? 'bg-brand-blue text-white shadow-glow' : 'bg-white text-ink/30 border-2 border-slate-200'}`}>
                 {s}
               </div>
             ))}
          </div>

          <div className="soft-card rounded-[48px] p-8 md:p-12">
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 flex items-center animate-pulse">
                <span className="mr-2">⚠️</span>
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="animate-rise">
                <h2 className="font-display text-3xl font-black text-ink mb-6">Select a class</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {classes.map(c => (
                    <button 
                      key={c._id} 
                      onClick={() => { setSelectedClass(c); setStep(2); }}
                      className="p-6 rounded-3xl border-2 border-slate-100 hover:border-brand-blue transition-all bg-white hover:shadow-xl text-left group"
                    >
                      <h3 className="font-display text-xl group-hover:text-brand-blue transition-colors">{c.title}</h3>
                      <p className="mt-2 text-sm text-ink/60 line-clamp-2">{c.description}</p>
                      <div className="mt-4 flex items-center justify-between">
                         <span className="bg-ocean/10 text-ocean text-xs font-bold px-3 py-1 rounded-full">{c.duration}</span>
                         <span className="text-lg font-black text-brand-blue">AED {c.price}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-rise">
                <h2 className="font-display text-3xl font-black text-ink mb-6">Select Location</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {locations.map(loc => (
                    <button 
                      key={loc._id} 
                      onClick={() => { setSelectedLocation(loc._id); setStep(3); }}
                      className={`p-8 rounded-[40px] border-2 transition-all text-left flex items-center gap-6 ${selectedLocation === loc._id ? 'border-brand-blue bg-brand-blue/5 shadow-xl' : 'border-slate-50 bg-white hover:border-brand-blue/30'}`}
                    >
                      <div className="w-16 h-16 rounded-[24px] bg-slate-50 flex items-center justify-center text-3xl">📍</div>
                      <div>
                        <h3 className="font-display text-xl text-ink">{loc.name}</h3>
                        <p className="text-sm text-ink/40 mt-1">{loc.city || loc.address}</p>
                      </div>
                    </button>
                  ))}
                  {locations.length === 0 && <p className="col-span-full py-12 text-center text-ink/30 italic">No locations available.</p>}
                </div>
                <div className="mt-12 flex items-center justify-between">
                   <button onClick={() => setStep(1)} className="text-sm font-bold text-ink/40 hover:text-ink transition-colors px-6 py-3">Back to classes</button>
                </div>
              </div>
            )}

            {step === 3 && selectedClass && (
              <div className="animate-rise">
                <h2 className="font-display text-3xl font-black text-ink mb-2">Trainer & Time</h2>
                <p className="text-ink/60 mb-8">{selectedClass.title} • {selectedClass.duration} • AED {selectedClass.price}</p>
                
                <div className="space-y-8">
                  <div>
                    <label className="block text-xs font-bold text-ink/40 uppercase tracking-widest mb-3">Choose Trainer</label>
                    <select 
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
                      value={selectedTrainer}
                      onChange={(e) => setSelectedTrainer(e.target.value)}
                    >
                      <option value="">Select Trainer</option>
                      {trainers.map(t => (
                        <option key={t._id} value={t._id}>{t.name}</option>
                      ))}
                    </select>
                    {selectedLocation && trainers.length === 0 && (
                      <p className="text-[10px] text-coral font-bold mt-2 ml-2 italic">
                        No trainers available for this class at the selected branch.
                      </p>
                    )}
                  </div>

                  {selectedTrainer && (
                    <div className="animate-rise">
                      <label className="block text-xs font-bold text-ink/40 uppercase tracking-widest mb-3">Available Slots</label>
                      {loading ? <div className="animate-pulse h-12 bg-slate-100 rounded-2xl"></div> : (
                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                          {sessions.length > 0 ? sessions.map(s => (
                            <button 
                              key={s._id} 
                              onClick={() => setSelectedSession(s)}
                              className={`p-4 rounded-2xl border-2 text-sm font-bold transition-all ${selectedSession?._id === s._id ? 'border-brand-blue bg-brand-blue/5 text-brand-blue shadow-sm' : 'border-slate-50 bg-white hover:bg-slate-50 text-ink/70'}`}
                            >
                              <div className="text-[10px] text-ink/40 mb-1">{new Date(s.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                              <div>{new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                              <div className="mt-1 text-[10px] font-medium">{s.capacity - (s.bookedParticipants || 0)} spots left</div>
                            </button>
                          )) : <p className="col-span-full text-sm text-ink/40 italic py-4">No available sessions for this trainer.</p>}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-12 flex items-center justify-between">
                   <button onClick={() => setStep(2)} className="text-sm font-bold text-ink/40 hover:text-ink transition-colors px-6 py-3">Back to location</button>
                   <button onClick={handleNextStep} disabled={!selectedSession} className="bg-brand-blue text-white px-10 py-3 rounded-full font-black shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale">Continue</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="animate-rise">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-display text-3xl font-black text-ink">Participants</h2>
                  <button onClick={addParticipant} className="bg-brand-blue/10 text-brand-blue px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-blue/20 transition-all">+ Add more</button>
                </div>

                <div className="mb-8 p-6 rounded-[32px] bg-brand-blue/5 border border-brand-blue/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-blue">Selected Program</p>
                    <p className="font-display text-xl mt-1 text-ink">{selectedClass.title}</p>
                    <p className="text-sm font-bold text-ink/60 mt-2">
                       {locations.find(l => l._id === selectedLocation)?.name || 'Central'} • {new Date(selectedSession.startTime).toLocaleDateString()} at {new Date(selectedSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="md:text-right">
                    <p className="text-2xl font-black text-ink">AED {selectedClass.price}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-ink/40 mt-1">Per Participant</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {participants.map((p, idx) => (
                    <div key={idx} className="p-6 rounded-[32px] bg-slate-50 relative animate-rise">
                      {participants.length > 1 && (
                        <button onClick={() => removeParticipant(idx)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white text-red-400 hover:text-red-600 shadow-sm flex items-center justify-center transition-all">×</button>
                      )}
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/30 mb-4 px-2">Participant {idx + 1}</h3>
                      <div className="grid gap-4 md:grid-cols-3">
                         <div>
                            <input 
                              type="text" 
                              placeholder="Name" 
                              className="w-full bg-white border-none rounded-2xl py-3 px-5 text-sm font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
                              value={p.name}
                              onChange={(e) => updateParticipant(idx, 'name', e.target.value)}
                            />
                         </div>
                         <div>
                            <input 
                              type="number" 
                              placeholder="Age" 
                              className="w-full bg-white border-none rounded-2xl py-3 px-5 text-sm font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
                              value={p.age}
                              onChange={(e) => updateParticipant(idx, 'age', e.target.value)}
                            />
                         </div>
                         <div className="flex bg-white rounded-2xl p-1 shadow-sm">
                            {['male', 'female'].map(g => (
                              <button 
                                key={g} 
                                onClick={() => updateParticipant(idx, 'gender', g)}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${p.gender === g ? 'bg-brand-blue text-white shadow-md' : 'text-ink/30 hover:text-ink/60'}`}
                              >
                                {g}
                              </button>
                            ))}
                         </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-12 flex items-center justify-between">
                   <button onClick={() => setStep(3)} className="text-sm font-bold text-ink/40 hover:text-ink transition-colors px-6 py-3">Back to selection</button>
                   <button onClick={handleNextStep} className="bg-brand-blue text-white px-10 py-3 rounded-full font-black shadow-lg hover:scale-105 active:scale-95 transition-all">Review & Summary</button>
                </div>
              </div>
            )}

             {step === 5 && (
              <div className="animate-rise">
                <h2 className="font-display text-3xl font-black text-ink mb-8 text-center">Summary</h2>
                <div className="space-y-6">
                   <div className="flex justify-between p-6 rounded-3xl bg-slate-50 border border-slate-100">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-ink/30">Class & Session</p>
                        <p className="mt-1 font-display text-xl">{selectedClass.title}</p>
                        <p className="text-xs font-bold text-brand-blue uppercase tracking-widest mt-1">Branch: {locations.find(l => l._id === selectedLocation)?.name || 'Central'}</p>
                        <p className="text-sm text-ink/60 mt-1">{new Date(selectedSession.startTime).toLocaleDateString()} • {new Date(selectedSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-ink/30">Trainer</p>
                        <p className="mt-1 font-bold text-ink/80">{sessions.find(s => s._id === selectedSession._id)?.trainerId?.name || 'Assigned Trainer'}</p>
                      </div>
                   </div>

                   <div className="p-6 rounded-3xl bg-white border border-slate-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-ink/30 mb-4">Participants ({participants.length})</p>
                      <div className="space-y-3">
                         {participants.map((p, i) => (
                           <div key={i} className="flex justify-between items-center text-sm">
                              <span className="font-bold text-ink/80">{p.name}</span>
                              <span className="text-ink/40">{p.age} Years • {p.gender}</span>
                           </div>
                         ))}
                      </div>
                   </div>

                    <div className="pt-6 border-t-2 border-slate-50 flex justify-between items-end">
                       <div>
                         <p className="text-3xl font-black text-brand-blue">AED {selectedClass.price * participants.length}</p>
                         <p className="text-xs text-ink/40 font-bold uppercase tracking-widest mt-1">AED {selectedClass.price} x {participants.length} Person(s)</p>
                       </div>
                       <button onClick={() => {
                         if (!getUser()) {
                           setStep(6);
                         } else {
                           setStep(7);
                         }
                       }} className="bg-brand-blue text-white px-10 py-4 rounded-full font-black shadow-lg hover:scale-105 active:scale-95 transition-all">Continue to Payment</button>
                    </div>
                 </div>
                 <div className="mt-8 text-center">
                    <button onClick={() => setStep(4)} className="text-sm font-bold text-ink/40 hover:text-ink transition-colors">Edit details</button>
                 </div>
               </div>
             )}

             {step === 6 && (
              <div className="animate-rise text-center py-10">
                {!showGuestForm ? (
                  <>
                    <div className="w-20 h-20 bg-brand-blue/10 text-brand-blue rounded-full flex items-center justify-center text-4xl mx-auto mb-6">👋</div>
                    <h2 className="font-display text-3xl font-black text-ink mb-2">You are not logged in</h2>
                    <p className="text-ink/60 mb-10 max-w-md mx-auto">Log in to save this booking to your account, or continue as a guest to quickly secure your spot.</p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                       <button onClick={() => navigate('/login?redirect=/calendar')} className="bg-brand-blue text-white w-full sm:w-auto px-10 py-4 rounded-full font-black shadow-lg hover:scale-105 active:scale-95 transition-all">Log In</button>
                       <p className="text-ink/40 font-bold text-xs uppercase mx-4">Or</p>
                       <button onClick={() => setShowGuestForm(true)} className="bg-white border-2 border-slate-200 text-ink/80 w-full sm:w-auto px-10 py-4 rounded-full font-black hover:border-brand-blue hover:text-brand-blue transition-all">Continue as Guest</button>
                    </div>
                  </>
                ) : (
                  <div className="max-w-md mx-auto text-left animate-rise">
                    <h2 className="font-display text-3xl font-black text-ink mb-2 text-center">Guest Details</h2>
                    <p className="text-ink/60 mb-8 text-center text-sm">We need a few details to send your booking confirmation.</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-ink/40 uppercase tracking-widest mb-2 px-2">Full Name</label>
                        <input 
                          type="text" 
                          placeholder="Parent / Guardian Name" 
                          className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-ink focus:border-brand-blue focus:ring-0 outline-none transition-all"
                          value={guestDetails.name}
                          onChange={(e) => setGuestDetails({...guestDetails, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-ink/40 uppercase tracking-widest mb-2 px-2">Email Address</label>
                        <input 
                          type="email" 
                          placeholder="Your Email" 
                          className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-ink focus:border-brand-blue focus:ring-0 outline-none transition-all"
                          value={guestDetails.email}
                          onChange={(e) => setGuestDetails({...guestDetails, email: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-ink/40 uppercase tracking-widest mb-2 px-2">Phone Number</label>
                        <input 
                          type="tel" 
                          placeholder="Your Phone Number" 
                          className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-ink focus:border-brand-blue focus:ring-0 outline-none transition-all"
                          value={guestDetails.phone}
                          onChange={(e) => setGuestDetails({...guestDetails, phone: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between">
                       <button onClick={() => setShowGuestForm(false)} className="text-sm font-bold text-ink/40 hover:text-ink transition-colors px-6 py-3 order-2 sm:order-1 text-center">Back</button>
                       <button onClick={handleNextStep} className="bg-brand-blue text-white w-full sm:w-auto px-10 py-4 rounded-full font-black shadow-lg hover:scale-105 active:scale-95 transition-all order-1 sm:order-2">Continue to Payment</button>
                    </div>
                  </div>
                )}
                
                {!showGuestForm && (
                  <div className="mt-12">
                     <button onClick={() => setStep(5)} className="text-sm font-bold text-ink/40 hover:text-ink transition-colors">Back to summary</button>
                  </div>
                )}
              </div>
             )}

             {step === 7 && (
              <div className="animate-rise text-center py-10">
                {paymentType === 'online' ? (
                  <PaymentForm 
                    totalAmount={selectedClass.price * participants.length} 
                    onSubmit={handleCreateBooking}
                    onCancel={() => { setPaymentType(''); setStep(5); }}
                  />
                ) : (
                  <>
                    <h2 className="font-display text-3xl font-black text-ink mb-2">Payment Method</h2>
                    <p className="text-ink/60 mb-10">Choose how you would like to pay for your session.</p>
                    
                    <div className="grid gap-4 sm:grid-cols-2 text-left">
                       <button onClick={() => setPaymentType('online')} className="p-8 rounded-[40px] border-2 border-slate-50 bg-white hover:border-brand-blue hover:shadow-xl transition-all group flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-brand-blue/10 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">💳</div>
                          <h3 className="font-display text-xl group-hover:text-brand-blue">Online Payment</h3>
                          <p className="text-xs text-ink/40 mt-2 font-medium">Add a card • Secure and fast</p>
                       </button>
                       <button onClick={handleCreateBooking} className="p-8 rounded-[40px] border-2 border-slate-50 bg-white hover:border-brand-blue hover:shadow-xl transition-all group flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">📍</div>
                          <h3 className="font-display text-xl group-hover:text-brand-blue">Pay at Center</h3>
                          <p className="text-xs text-ink/40 mt-2 font-medium">Cash or Card at the gym</p>
                       </button>
                    </div>

                    <div className="mt-12">
                       <button onClick={() => setStep(5)} className="text-sm font-bold text-ink/40 hover:text-ink transition-colors">Back to summary</button>
                    </div>
                  </>
                )}
              </div>
            )}
  
              {step === 8 && (
              <div className="animate-rise text-center py-12">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 animate-bounce transition-transform">✓</div>
                <h2 className="font-display text-4xl font-black text-ink mb-4">Awesome!</h2>
                <p className="text-ink/60 text-lg mb-10 max-w-md mx-auto">Your booking for {participants.length} participant(s) has been successfully placed. We've sent an email confirmation.</p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                   <button onClick={() => navigate('/dashboard/bookings')} className="bg-brand-blue text-white px-10 py-3 rounded-full font-black shadow-lg hover:translate-y-[-2px] active:translate-y-0 transition-all">Go to My Bookings</button>
                   <button onClick={() => navigate('/')} className="bg-white border-2 border-slate-100 text-ink/60 px-10 py-3 rounded-full font-black hover:bg-slate-50 transition-all">Home</button>
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
