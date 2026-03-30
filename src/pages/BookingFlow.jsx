import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/api.js';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { getUser } from '../utils/auth.js';
import PaymentForm from '../components/PaymentForm.jsx';

export default function BookingFlow() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const classIdFromUrl = searchParams.get('classId');
  const locationIdFromUrl = searchParams.get('locationId');
  const sessionIdFromUrl = searchParams.get('sessionId');
  const isRestoringParam = searchParams.get('restoring') === 'true';

  const [step, setStep] = useState(1);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [trainers, setTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [sessions, setSessions] = useState([]);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [selectedDateFilter, setSelectedDateFilter] = useState('');

  // Reset selected sessions when class, location or trainer changes
  useEffect(() => {
    if (!isRestoring) {
      setSelectedSessions([]);
    }
  }, [selectedClass?._id, selectedLocation, selectedTrainer]);
  const [participants, setParticipants] = useState([{ name: '', age: '', gender: 'male', relation: '' }]);
  const [paymentType, setPaymentType] = useState(''); // 'online' or 'center'
  const [guestDetails, setGuestDetails] = useState({ name: '', email: '', phone: '' });
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [createdBookings, setCreatedBookings] = useState([]);
  const [isRestoring, setIsRestoring] = useState(false);
  const [myChildren, setMyChildren] = useState([]);

  // Persistence: Save to sessionStorage
  useEffect(() => {
    if (step > 1 && step < 8 && !isRestoring) {
      const bookingState = {
        step,
        selectedClass,
        selectedLocation,
        selectedTrainer,
        selectedSessions,
        participants,
        guestDetails,
        showGuestForm
      };
      sessionStorage.setItem('booking_pending_state', JSON.stringify(bookingState));

      // Auto-add restoring=true to URL to ensure progress is kept on refresh
      if (!isRestoringParam) {
        const params = new URLSearchParams(window.location.search);
        params.set('restoring', 'true');
        setSearchParams(params, { replace: true });
      }
    }
  }, [step, selectedClass, selectedLocation, selectedTrainer, selectedSessions, participants, isRestoring]);

  // Persistence: If logged in during step 6, move to 7
  useEffect(() => {
    if (step === 6 && getUser()) {
      setStep(7);
    }
  }, [step]);

  // Persistence: Restore from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('booking_pending_state');

    if (!isRestoringParam) {
      // Fresh entry - clear any old state to avoid jump-to-payment
      sessionStorage.removeItem('booking_pending_state');
      return;
    }

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only restore if we are not already in a fresh flow from URL with a DIFFERENT class
        if (!classIdFromUrl || classIdFromUrl === parsed.selectedClass?._id) {
          setIsRestoring(true);
          setStep(parsed.step);
          setSelectedClass(parsed.selectedClass);
          setSelectedLocation(parsed.selectedLocation);
          setSelectedTrainer(parsed.selectedTrainer);
          setSessions(parsed.selectedSessions);
          setParticipants(parsed.participants);
          if (parsed.guestDetails) setGuestDetails(parsed.guestDetails);
          if (parsed.showGuestForm !== undefined) setShowGuestForm(parsed.showGuestForm);
          setTimeout(() => setIsRestoring(false), 100);
        }
      } catch (e) {
        console.error("Failed to restore booking state", e);
      }
    }
  }, [isRestoringParam]);

  // Step 1: Fetch Classes
  useEffect(() => {
    if (step > 1 && !selectedClass && !loading && !isRestoring) {
      setStep(1);
    }
  }, [step, selectedClass, loading, isRestoring]);

  // Step 1: Fetch Classes
  useEffect(() => {
    setLoading(true);
    const params = {
      locationId: locationIdFromUrl || undefined
    };
    api.get('/classes', { params })
      .then(res => {
        setClasses(res.data);
        if (classIdFromUrl) {
          const found = res.data.find(c => c._id === classIdFromUrl);
          if (found) {
            setSelectedClass(found);
            // If we have a classId from URL, we should at least be on Step 2
            if (step === 1 && !isRestoringParam) {
              setStep(2);
            }
            // Auto-select location from URL or Class data
            if (!selectedLocation) {
              if (locationIdFromUrl) {
                setSelectedLocation(locationIdFromUrl);
              } else if (found.locationId) {
                setSelectedLocation(found.locationId._id || found.locationId);
              }
            }
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [classIdFromUrl]);

  // Step 1.1: Fetch specific session if sessionId is in URL
  useEffect(() => {
    if (sessionIdFromUrl && !isRestoringParam) {
      setLoading(true);
      api.get(`/sessions/${sessionIdFromUrl}`)
        .then(res => {
          const session = res.data;
          if (session) {
            setSelectedTrainer(session.trainerId?._id || session.trainerId);
            setSelectedSessions([session]);
            setStep(4);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [sessionIdFromUrl]);

  // Fetch Locations (Filtered by Class if selected)
  useEffect(() => {
    let url = '/locations?activeClasses=true';
    if (selectedClass) {
      url += `&classId=${selectedClass._id}`;
    }
    api.get(url)
      .then(res => {
        const data = res.data || [];
        setLocations(data);

        // If restoring a state, don't reset
        if (isRestoring) return;

        // If current selected location is not in the new filtered list, reset it
        if (selectedLocation && !data.find(l => l._id === selectedLocation)) {
          setSelectedLocation('');
        }
      })
      .catch(() => { });
  }, [selectedClass?._id, isRestoring]);

  // Fetch My Children for Step 4
  useEffect(() => {
    if (step === 4 && getUser()) {
      api.get('/children/mine')
        .then(res => setMyChildren(res.data || []))
        .catch(() => { });
    }
  }, [step]);

  // Step 3: Fetch Trainers for selected class and location
  useEffect(() => {
    if (selectedClass && selectedLocation) {
      const classTrainers = selectedClass.availableTrainers || [];
      // Filter trainers by location
      const filtered = classTrainers.filter(t => {
        const tLocationIds = t.locationIds || [];
        // Check if current selectedLocation is in trainer's locations
        return tLocationIds.some(loc => (loc._id || loc) === selectedLocation);
      });
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

          // Auto-select first date group if available
          const groups = Array.from(new Set(res.data.map(s =>
            new Date(s.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
          )));
          if (groups.length > 0) setSelectedDateFilter(groups[0]);

          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [selectedClass, selectedTrainer]);

  // Group sessions by date string
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

  const handleNextStep = () => {
    if (step === 2 && !selectedLocation) {
      setError('Please select a branch location');
      return;
    }
    if (step === 3 && selectedSessions.length === 0) {
      setError('Please select at least one time slot');
      return;
    }
    if (step === 4) {
      // Basic validation
      for (const p of participants) {
        if (!p.name || !p.age) {
          setError('Please fill in all participant details');
          return;
        }
        // New Structured Validation
        const pAge = parseInt(p.age);

        // Age validation
        if (selectedClass.minAge !== undefined && selectedClass.minAge !== null && pAge < selectedClass.minAge) {
          setError(`${p.name} is too young for this class. Minimum age: ${selectedClass.minAge}`);
          return;
        }
        if (selectedClass.maxAge !== undefined && selectedClass.maxAge !== null && pAge > selectedClass.maxAge) {
          setError(`${p.name} is too old for this class. Maximum age: ${selectedClass.maxAge}`);
          return;
        }

        // Gender validation
        if (selectedClass.genderRestriction && selectedClass.genderRestriction !== 'any') {
          if (p.gender.toLowerCase() !== selectedClass.genderRestriction.toLowerCase()) {
            setError(`${p.name}'s gender does not match the class restriction: ${selectedClass.genderRestriction}`);
            return;
          }
        }
      }
      // Capacity validation for ALL selected sessions
      for (const sess of selectedSessions) {
        const remaining = sess.capacity - (sess.bookedParticipants || 0);
        if (participants.length > remaining) {
          const dateStr = new Date(sess.startTime).toLocaleDateString();
          setError(`Only ${remaining} spots left for ${dateStr}. You are trying to book ${participants.length}.`);
          return;
        }
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
      const results = [];
      for (const sess of selectedSessions) {
        const payload = {
          participants,
          classId: selectedClass._id,
          sessionId: sess._id,
          locationId: selectedLocation,
          date: sess.startTime,
          paymentMethod: paymentType || 'center',
          paymentStatus: paymentType === 'online' ? 'completed' : 'pending',
          guestDetails: !getUser() ? guestDetails : undefined
        };
        const res = await api.post('/bookings', payload);
        results.push(res.data);
      }
      sessionStorage.removeItem('booking_pending_state'); // Clear persistence on success
      setCreatedBookings(results);
      setStep(8); // Success step
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const addParticipant = () => {
    setParticipants([...participants, { name: '', age: '', gender: 'male', relation: '' }]);
  };

  const removeParticipant = (index) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const updateParticipant = (index, field, value) => {
    const newParticipants = [...participants];
    newParticipants[index][field] = value;

    // Auto-fill logic for "Self"
    if (field === 'relation' && value === 'Self') {
      const user = getUser();
      if (user) {
        newParticipants[index].name = user.name || newParticipants[index].name;
      }
    }

    setParticipants(newParticipants);
  };

  const handleChildSelect = (index, childId) => {
    const newParticipants = [...participants];
    if (childId === 'new') {
      newParticipants[index] = { ...newParticipants[index], name: '', age: '', gender: 'male', childId: undefined };
    } else {
      const child = myChildren.find(c => c._id === childId);
      if (child) {
        newParticipants[index] = {
          ...newParticipants[index],
          name: child.name,
          age: child.age || '',
          gender: child.gender === 'other' ? 'male' : (child.gender || 'male'),
          childId: child._id
        };
      }
    }
    setParticipants(newParticipants);
  };

  const bookForMyself = () => {
    const user = getUser();
    if (!user) {
      setStep(6); // Go to login if not logged in
      return;
    }

    const newParticipants = [...participants];
    // Find first empty or default participant to fill, or add new one
    let targetIdx = newParticipants.findIndex(p => !p.name && !p.age);
    if (targetIdx === -1) {
      newParticipants.push({ name: user.name, age: '', gender: 'male', relation: 'Self' });
    } else {
      newParticipants[targetIdx] = { ...newParticipants[targetIdx], name: user.name, relation: 'Self' };
    }
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
                      <div className="w-16 h-16 rounded-[24px] bg-slate-50 flex items-center justify-center text-3xl overflow-hidden shrink-0">
                        {loc.imageUrl ? (
                          <img
                            src={loc.imageUrl.startsWith('http') ? loc.imageUrl : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${loc.imageUrl}`}
                            alt={loc.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          '📍'
                        )}
                      </div>
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
                    <div
                      onClick={() => { setShowTrainerModal(true); setActiveImage(0); }}
                      className="animate-rise p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6 cursor-pointer hover:shadow-md transition-all hover:border-brand-blue/20 group"
                    >
                      <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                        {trainers.find(t => t._id === selectedTrainer)?.avatarUrl ? (
                          <img
                            src={trainers.find(t => t._id === selectedTrainer).avatarUrl.startsWith('http') ? trainers.find(t => t._id === selectedTrainer).avatarUrl : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${trainers.find(t => t._id === selectedTrainer).avatarUrl}`}
                            alt="Trainer"
                            className="h-full w-full object-cover"
                          />
                        ) : '🏆'}
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                          <h3 className="font-display text-xl text-ink underline-offset-4 group-hover:underline">{trainers.find(t => t._id === selectedTrainer)?.name}</h3>
                          <span className="text-[10px] text-brand-blue font-black uppercase tracking-widest bg-brand-blue/5 px-2 py-0.5 rounded-md">View Profile</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 justify-center md:justify-start mb-2">
                          {(trainers.find(t => t._id === selectedTrainer)?.specialties || []).map((spec, i) => (
                            <span key={i} className="text-[9px] font-black uppercase tracking-widest text-brand-blue bg-brand-blue/5 px-2 py-0.5 rounded-md">{spec}</span>
                          ))}
                        </div>
                        <p className="text-sm text-ink/60 leading-relaxed italic line-clamp-2">
                          "{trainers.find(t => t._id === selectedTrainer)?.bio || 'Dedicated coach committed to child development and fitness excellence.'}"
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedTrainer && (
                    <div className="animate-rise">
                      <label className="block text-xs font-bold text-ink/40 uppercase tracking-widest mb-3">Available Slots</label>
                      {loading ? <div className="animate-pulse h-12 bg-slate-100 rounded-2xl"></div> : (
                        <div>
                          {dateKeys.length > 0 ? (
                            <>
                              {/* Date Navigation Tabs */}
                              <div className="flex gap-2 overflow-x-auto pb-4 mb-4 select-none scrollbar-hide snap-x">
                                {dateKeys.map(dKey => (
                                  <button
                                    key={dKey}
                                    onClick={() => setSelectedDateFilter(dKey)}
                                    className={`snap-start shrink-0 px-6 py-3 rounded-full text-sm font-bold transition-all border-2 ${selectedDateFilter === dKey ? 'bg-brand-blue text-white shadow-md border-brand-blue' : 'bg-white text-ink/60 border-slate-100 hover:border-brand-blue/30 hover:text-ink'}`}
                                  >
                                    {dKey}
                                  </button>
                                ))}
                              </div>

                              {/* Slots for Selected Date */}
                              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                                {(sessionGroups[selectedDateFilter] || []).map(s => {
                                  const isSelected = selectedSessions.find(sess => sess._id === s._id);
                                  const spotsLeft = s.capacity - (s.bookedParticipants || 0);
                                  return (
                                    <button
                                      key={s._id}
                                      onClick={() => {
                                        if (isSelected) {
                                          setSelectedSessions(selectedSessions.filter(sess => sess._id !== s._id));
                                        } else {
                                          setSelectedSessions([...selectedSessions, s]);
                                        }
                                      }}
                                      className={`p-5 rounded-3xl border-2 transition-all text-left flex flex-col justify-center items-center gap-1 ${isSelected ? 'border-brand-blue bg-brand-blue/5 text-brand-blue shadow-glow' : 'border-slate-100 bg-white hover:border-brand-blue/30 hover:bg-slate-50 text-ink/80'}`}
                                    >
                                      <span className="text-xl font-black font-display">
                                        {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-brand-blue/70' : 'text-ink/40'}`}>
                                        {spotsLeft} spots left
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          ) : (
                            <p className="text-sm text-ink/40 italic py-4">No available sessions for this trainer.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-12 flex items-center justify-between">
                  <button onClick={() => setStep(2)} className="text-sm font-bold text-ink/40 hover:text-ink transition-colors px-6 py-3">Back to location</button>
                  <button onClick={handleNextStep} disabled={selectedSessions.length === 0} className="bg-brand-blue text-white px-10 py-3 rounded-full font-black shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale">Continue ({selectedSessions.length})</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="animate-rise">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-display text-3xl font-black text-ink">Participants</h2>
                  <div className="flex gap-2">
                    {getUser() && !participants.some(p => p.relation === 'Self') && (
                      <button onClick={bookForMyself} className="bg-brand-blue text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-sm">Book for myself</button>
                    )}
                    <button onClick={addParticipant} className="bg-brand-blue/10 text-brand-blue px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-blue/20 transition-all">+ Add more</button>
                  </div>
                </div>

                <div className="mb-8 p-6 rounded-[32px] bg-brand-blue/5 border border-brand-blue/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-blue">Selected Program</p>
                    <p className="font-display text-xl mt-1 text-ink">{selectedClass?.title || 'N/A'} • {selectedClass?.ageGroup || 'N/A'}</p>
                    {selectedClass?.minAge !== undefined && selectedClass?.maxAge !== undefined && (
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 bg-amber-50 inline-block px-3 py-1 rounded-full mt-2">
                        Required Age: {selectedClass.minAge} - {selectedClass.maxAge} Years
                      </p>
                    )}
                    <div className="mt-3 space-y-1">
                      <p className="text-sm font-bold text-ink/60">
                        {locations.find(l => l._id === selectedLocation)?.name || 'Central'} • {selectedSessions.length} Session(s) Selected
                      </p>
                      {selectedSessions.map((sess, i) => (
                        <p key={i} className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue/70">
                          {new Date(sess.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} @ {new Date(sess.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {trainers.find(t => t._id === selectedTrainer) && ` • Coach ${trainers.find(t => t._id === selectedTrainer).name}`}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="md:text-right">
                    <p className="text-2xl font-black text-ink">AED {selectedClass?.price || 0}</p>
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
                      <div className="grid gap-4 md:grid-cols-5">
                        {myChildren.length > 0 && (
                          <div>
                            <select
                              className="w-full bg-white border-none rounded-2xl py-3 px-5 text-sm font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all appearance-none cursor-pointer"
                              onChange={(e) => handleChildSelect(idx, e.target.value)}
                              value={p.childId || 'new'}
                            >
                              <option value="new">New Participant</option>
                              {myChildren.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div className={myChildren.length > 0 ? '' : 'md:col-span-1'}>
                          <input
                            type="text"
                            placeholder="Name"
                            className="w-full bg-white border-none rounded-2xl py-3 px-5 text-sm font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
                            value={p.name}
                            onChange={(e) => updateParticipant(idx, 'name', e.target.value)}
                            disabled={p.childId}
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="Age"
                            className={`w-full bg-white border-none rounded-2xl py-3 px-5 text-sm font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all ${
                              p.age && (
                                (selectedClass.minAge !== undefined && parseInt(p.age) < selectedClass.minAge) || 
                                (selectedClass.maxAge !== undefined && parseInt(p.age) > selectedClass.maxAge)
                              ) ? 'ring-2 ring-red-400 bg-red-50' : ''
                            }`}
                            value={p.age}
                            onChange={(e) => updateParticipant(idx, 'age', e.target.value)}
                            disabled={p.childId}
                          />
                          {p.age && selectedClass.minAge !== undefined && parseInt(p.age) < selectedClass.minAge && (
                            <p className="text-[8px] font-bold text-red-500 mt-1 px-1">Too young</p>
                          )}
                          {p.age && selectedClass.maxAge !== undefined && parseInt(p.age) > selectedClass.maxAge && (
                            <p className="text-[8px] font-bold text-red-500 mt-1 px-1">Too old</p>
                          )}
                        </div>
                        <div>
                          <select
                            className="w-full bg-white border-none rounded-2xl py-3 px-5 text-sm font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all appearance-none cursor-pointer"
                            value={p.relation}
                            onChange={(e) => updateParticipant(idx, 'relation', e.target.value)}
                          >
                            <option value="">Relation</option>
                            <option value="Self">Self (Me)</option>
                            <option value="Father">Father</option>
                            <option value="Mother">Mother</option>
                            <option value="Guardian">Guardian</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="flex bg-white rounded-2xl p-1 shadow-sm">
                          {['male', 'female'].map(g => (
                            <button
                              key={g}
                              disabled={p.childId}
                              onClick={() => updateParticipant(idx, 'gender', g)}
                              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${p.gender === g ? 'bg-brand-blue text-white shadow-md' : 'text-ink/30 hover:text-ink/60 disabled:opacity-50'}`}
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
                <div className="text-center mb-10">
                  <h2 className="font-display text-4xl font-black text-ink tracking-tight mb-2">Review & Summary</h2>
                  <p className="text-sm font-bold text-ink/40 uppercase tracking-[0.3em]">Final Step before payment</p>
                </div>
                
                <div className="space-y-8">
                  {/* Program Overview */}
                  <div className="p-8 rounded-[40px] bg-gradient-to-br from-brand-blue/10 to-brand-blue/5 border border-brand-blue/20 relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/30 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue mb-2">Selected Program</p>
                        <h3 className="font-display text-3xl text-ink leading-tight">{selectedClass.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          <span className="text-xs font-black uppercase tracking-widest text-ink/60 bg-white/80 px-4 py-1.5 rounded-full shadow-sm border border-slate-100">
                            {selectedClass.ageGroup}
                          </span>
                          <span className="text-sm font-black text-ocean flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-ocean animate-pulse"></span>
                             {locations.find(l => l._id === selectedLocation)?.name || 'Central Branch'}
                          </span>
                        </div>
                      </div>
                      <div className="hidden md:flex w-20 h-20 rounded-[2rem] bg-white/80 backdrop-blur-sm border border-brand-blue/10 items-center justify-center text-4xl shadow-xl shrink-0">
                         🏅
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-8 lg:grid-cols-2">
                    {/* Sessions Column */}
                    <div className="space-y-6">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/30 px-4">Schedule Details ({selectedSessions.length})</p>
                      <div className="space-y-4">
                        {selectedSessions.map((sess, i) => (
                          <div key={i} className="flex justify-between items-center bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 group hover:border-brand-blue/30 transition-all hover:shadow-md">
                            <div className="flex items-center gap-5">
                              <div className="w-14 h-14 rounded-2xl bg-brand-blue/5 flex flex-col items-center justify-center text-brand-blue shrink-0 group-hover:scale-105 transition-transform">
                                 <span className="text-[9px] font-black uppercase leading-none mb-0.5">{new Date(sess.startTime).toLocaleDateString('en-US', { month: 'short' })}</span>
                                 <span className="text-xl font-black leading-none">{new Date(sess.startTime).getDate()}</span>
                              </div>
                              <div>
                                <p className="font-black text-ink text-base">{new Date(sess.startTime).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                                <p className="text-[11px] text-brand-blue font-black uppercase tracking-widest mt-1 bg-brand-blue/5 px-2 py-0.5 rounded-md inline-block">
                                  {new Date(sess.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                               <p className="text-[9px] font-black uppercase tracking-widest text-ink/20 mb-1">Coach</p>
                               <p className="text-xs font-black text-brand-blue">{sess.trainerId?.name || trainers.find(t => t._id === selectedTrainer)?.name || 'TBA'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Participants Column */}
                    <div className="space-y-6">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/30 px-4">Participant List ({participants.length})</p>
                      <div className="grid gap-4">
                         {participants.map((p, i) => (
                           <div key={i} className="p-5 rounded-[32px] bg-white border border-slate-100 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-lg">
                                  {p.gender === 'male' ? '👦' : '👧'}
                                </div>
                                <div>
                                   <p className="font-black text-ink text-base line-clamp-1">{p.name}</p>
                                   <p className="text-[11px] font-bold text-ink/40 bg-slate-100 px-2 py-0.5 rounded-md inline-block mt-0.5 whitespace-nowrap">{p.relation || 'Me'}</p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                 <p className="text-sm font-black text-brand-blue">{p.age} Years</p>
                                 <p className="text-[9px] font-black uppercase tracking-widest text-ink/20 mt-1">{p.gender}</p>
                              </div>
                           </div>
                         ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing Footer */}
                  <div className="mt-10 pt-10 border-t-4 border-dashed border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                      <div className="flex items-baseline gap-2 justify-center md:justify-start">
                        <span className="text-5xl font-black text-brand-blue tracking-tighter">AED {(selectedClass?.price || 0) * participants.length * selectedSessions.length}</span>
                        <span className="text-sm font-bold text-ink/30 uppercase tracking-widest italic">Total</span>
                      </div>
                      <p className="text-[11px] text-ink/40 font-black uppercase tracking-[0.2em] mt-3 bg-slate-100/50 px-4 py-2 rounded-full border border-slate-100 inline-block font-body">
                         {selectedClass?.price || 0} AED × {participants.length} PPL × {selectedSessions.length} SESS
                      </p>
                    </div>
                    <button onClick={() => getUser() ? setStep(7) : setStep(6)} className="w-full md:w-auto bg-brand-blue text-white px-14 py-6 rounded-[2.5rem] font-black shadow-glow hover:scale-[1.03] active:scale-[0.98] transition-all text-xl hover:shadow-brand-blue/30 group">
                       Secure Booking Now <span className="ml-2 group-hover:translate-x-1 transition-transform inline-block">→</span>
                    </button>
                  </div>
                </div>
                
                <div className="mt-12 text-center">
                  <button onClick={() => setStep(4)} className="text-sm font-bold text-ink/40 hover:text-brand-blue transition-colors flex items-center justify-center gap-2 mx-auto group">
                    <span className="text-lg group-hover:-translate-x-1 transition-transform">←</span> Edit details & participants
                  </button>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="animate-rise text-center py-10">
                {getUser() ? (
                  <div className="max-w-md mx-auto text-center animate-rise">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">👤</div>
                    <h2 className="font-display text-3xl font-black text-ink mb-2">Welcome Back!</h2>
                    <p className="text-ink/60 mb-10">Logged in as <b>{getUser().name}</b>. You are now ready to complete your booking.</p>

                    <div className="flex flex-col gap-4">
                      <button onClick={() => setStep(7)} className="bg-brand-blue text-white w-full px-10 py-4 rounded-full font-black shadow-lg hover:scale-105 active:scale-95 transition-all">Continue to Payment</button>
                      <button onClick={() => setStep(5)} className="text-sm font-bold text-ink/40 hover:text-ink transition-colors px-6 py-3">Back to summary</button>
                    </div>
                  </div>
                ) : !showGuestForm ? (
                  <>
                    <div className="w-20 h-20 bg-brand-blue/10 text-brand-blue rounded-full flex items-center justify-center text-4xl mx-auto mb-6">👋</div>
                    <h2 className="font-display text-3xl font-black text-ink mb-2">You are not logged in</h2>
                    <p className="text-ink/60 mb-10 max-w-md mx-auto">Log in to save this booking to your account, or continue as a guest to quickly secure your spot.</p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                      <button onClick={() => navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)} className="bg-brand-blue text-white w-full sm:w-auto px-10 py-4 rounded-full font-black shadow-lg hover:scale-105 active:scale-95 transition-all">Log In</button>
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
                          onChange={(e) => setGuestDetails({ ...guestDetails, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-ink/40 uppercase tracking-widest mb-2 px-2">Email Address</label>
                        <input
                          type="email"
                          placeholder="Your Email"
                          className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-ink focus:border-brand-blue focus:ring-0 outline-none transition-all"
                          value={guestDetails.email}
                          onChange={(e) => setGuestDetails({ ...guestDetails, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-ink/40 uppercase tracking-widest mb-2 px-2">Phone Number</label>
                        <input
                          type="tel"
                          placeholder="Your Phone Number"
                          className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-ink focus:border-brand-blue focus:ring-0 outline-none transition-all"
                          value={guestDetails.phone}
                          onChange={(e) => setGuestDetails({ ...guestDetails, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between">
                      <button onClick={() => setShowGuestForm(false)} className="text-sm font-bold text-ink/40 hover:text-ink transition-colors px-6 py-3 order-2 sm:order-1 text-center">Back</button>
                      <button onClick={handleNextStep} className="bg-brand-blue text-white w-full sm:w-auto px-10 py-4 rounded-full font-black shadow-lg hover:scale-105 active:scale-95 transition-all order-1 sm:order-2">Continue to Pay</button>
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
                    totalAmount={(selectedClass?.price || 0) * participants.length * selectedSessions.length}
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
                <div className="mb-8 space-y-2">
                  {createdBookings.map((b, i) => (
                    <p key={i} className="text-brand-blue font-black tracking-widest text-sm uppercase">
                      Booking #{b.bookingNumber}
                    </p>
                  ))}
                </div>
                <p className="text-ink/60 text-lg mb-10 max-w-md mx-auto">Your booking for {participants.length} participant(s) has been successfully placed. We've sent an email confirmation.</p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button onClick={() => navigate('/dashboard/bookings')} className="bg-brand-blue text-white px-10 py-3 rounded-full font-black shadow-lg hover:translate-y-[-2px] active:translate-y-0 transition-all">Go to My Bookings</button>
                  <button onClick={() => navigate('/')} className="bg-white border-2 border-slate-100 text-ink/60 px-10 py-3 rounded-full font-black hover:bg-slate-50 transition-all">Home</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Trainer Detail Modal */}
        {showTrainerModal && selectedTrainer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-300"
              onClick={() => setShowTrainerModal(false)}
            />
            <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl p-8 overflow-hidden animate-rise">
              <button
                onClick={() => setShowTrainerModal(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-50 text-ink/40 flex items-center justify-center hover:bg-slate-100 hover:text-ink transition-all z-10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex flex-col md:flex-row gap-8">
                <div className="space-y-6 shrink-0 w-full md:w-auto">
                  {/* Main Image View */}
                  <div className="relative w-full max-w-[320px] aspect-square md:w-64 md:h-64 rounded-[40px] bg-slate-50 overflow-hidden shadow-inner border border-slate-100 mx-auto md:mx-0 group/main">
                    {(() => {
                      const trainer = trainers.find(t => t._id === selectedTrainer);
                      const images = [trainer?.avatarUrl, ...(trainer?.gallery || [])].filter(Boolean);
                      const currentImg = images[activeImage] || images[0];

                      if (!currentImg) return <div className="h-full w-full flex items-center justify-center text-7xl">🏆</div>;

                      return (
                        <img
                          src={currentImg.startsWith('http') ? currentImg : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${currentImg}`}
                          alt="Trainer Active"
                          className="h-full w-full object-cover animate-in fade-in zoom-in-95 duration-500"
                        />
                      );
                    })()}

                    {/* Navigation Arrows (if multiple) */}
                    {(() => {
                      const images = [trainers.find(t => t._id === selectedTrainer)?.avatarUrl, ...(trainers.find(t => t._id === selectedTrainer)?.gallery || [])].filter(Boolean);
                      if (images.length <= 1) return null;
                      return (
                        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover/main:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); setActiveImage(prev => (prev === 0 ? images.length - 1 : prev - 1)); }}
                            className="w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-ink hover:bg-white"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setActiveImage(prev => (prev === images.length - 1 ? 0 : prev + 1)); }}
                            className="w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-ink hover:bg-white"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Interactive Thumbnails */}
                  {(() => {
                    const images = [trainers.find(t => t._id === selectedTrainer)?.avatarUrl, ...(trainers.find(t => t._id === selectedTrainer)?.gallery || [])].filter(Boolean);
                    if (images.length <= 1) return null;
                    return (
                      <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        {images.map((img, idx) => (
                          <div
                            key={idx}
                            onClick={() => setActiveImage(idx)}
                            className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shadow-sm hover:scale-105 ${activeImage === idx ? 'border-brand-blue scale-110' : 'border-white hover:border-brand-blue/30'}`}
                          >
                            <img
                              src={img.startsWith('http') ? img : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${img}`}
                              className="w-full h-full object-cover"
                              alt={`Thumbnail ${idx}`}
                            />
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                <div className="flex-1">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-brand-blue mb-2">Coach Profile</p>
                  <h2 className="font-display text-4xl text-ink mb-4">{trainers.find(t => t._id === selectedTrainer)?.name}</h2>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {(trainers.find(t => t._id === selectedTrainer)?.specialties || []).map((spec, i) => (
                      <span key={i} className="text-xs font-bold text-brand-blue bg-brand-blue/5 px-3 py-1 rounded-full border border-brand-blue/10">
                        {spec}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-ink/30">Professional Biography</p>
                      <p className="text-ink/70 leading-relaxed text-sm whitespace-pre-line">
                        {trainers.find(t => t._id === selectedTrainer)?.bio || 'Full professional biography pending update.'}
                      </p>
                    </div>

                    {trainers.find(t => t._id === selectedTrainer)?.locationId && (
                      <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-ocean/10 flex items-center justify-center text-ocean text-xs">📍</div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-ink/30">Primary Branch</p>
                          <p className="text-sm font-bold text-ink/80">{locations.find(l => l._id === (trainers.find(t => t._id === selectedTrainer)?.locationId?._id || trainers.find(t => t._id === selectedTrainer)?.locationId))?.name || 'Central'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button
                  onClick={() => setShowTrainerModal(false)}
                  className="flex-1 bg-brand-blue text-white py-4 rounded-full font-black shadow-lg hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest"
                >
                  Select this Coach
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
