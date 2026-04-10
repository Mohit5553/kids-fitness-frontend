import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transactionId, setTransactionId] = useState('');
  const [applicablePromos, setApplicablePromos] = useState([]);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [bogoOption, setBogoOption] = useState('double'); // 'double' | 'person'

  // Step 1: Customer Data
  const [searchQuery, setSearchQuery] = useState('');
  const [customer, setCustomer] = useState(null); // { _id, name, email, phone }
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  // Step 2: Children Data
  const [availableChildren, setAvailableChildren] = useState([]);
  const [selectedChildrenIds, setSelectedChildrenIds] = useState([]);
  const [newChildren, setNewChildren] = useState([]); // [{ name, age, gender }]

  // Step 3: Class/Package Data
  const [classes, setClasses] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [bookingMode, setBookingMode] = useState('class'); // 'class' | 'package'

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

  // View Details Modal State
  const [detailsClass, setDetailsClass] = useState(null);
  const [detailsPlan, setDetailsPlan] = useState(null);

  // Package Scheduling (For memberships created via admin desk)
  const [preferredDays, setPreferredDays] = useState(['Mon', 'Wed', 'Fri']);
  const [preferredSlots, setPreferredSlots] = useState([]);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3);

  // Sync sessionsPerWeek with preferredDays as a smart default
  useEffect(() => {
    if (bookingMode === 'package') {
      setSessionsPerWeek(preferredDays.length || 1);
    }
  }, [preferredDays, bookingMode]);

  // Effect to fetch promos when step 6 is entered
  useEffect(() => {
    if (step === 6) {
      const locationId = selectedLocation || staff?.locationId?._id || staff?.locationId;
      const itemId = bookingMode === 'package' ? selectedPlan?._id : selectedClass?._id;
      const itemType = bookingMode === 'package' ? 'plan' : 'class';

      if (locationId && itemId) {
        api.get(`/promotions/active?locationId=${locationId}&itemId=${itemId}&itemType=${itemType}`)
          .then(res => setApplicablePromos(res.data || []))
          .catch(() => { });
      }
    } else {
      setApplicablePromos([]);
      setSelectedPromo(null);
      setDiscountAmount(0);
    }
  }, [step, bookingMode, selectedPlan, selectedClass, selectedLocation, staff?.locationId]);

  const totalParticipants = useMemo(() => {
    return (selectedChildrenIds?.length || 0) + (newChildren?.length || 0);
  }, [selectedChildrenIds, newChildren]);

  const currentPrice = useMemo(() => {
    if (bookingMode === 'package') return (selectedPlan?.price || 0) * totalParticipants;
    const basePrice = selectedClass?.price || 0;
    return basePrice * totalParticipants * (selectedSessions?.length || 1);
  }, [bookingMode, selectedPlan, selectedClass, totalParticipants, selectedSessions]);

  const calculateDiscount = (promo, price) => {
    if (!promo || !price) return 0;
    let disc = 0;
    if (promo.promoType === 'percentage' || (promo.promoType === 'flash' && promo.discountType === 'percentage')) {
      disc = (price * (promo.discountValue / 100));
    } else if (promo.promoType === 'cash' || (promo.promoType === 'flash' && promo.discountType === 'flat')) {
      disc = Math.min(price, promo.discountValue);
    } else if (promo.promoType === 'tiered') {
      const tier = promo.discountTiers
        ?.filter(t => price >= t.minAmount)
        .sort((a, b) => b.minAmount - a.minAmount)[0];
      if (tier) {
        disc = tier.type === 'percentage' ? (price * (tier.value / 100)) : Math.min(price, tier.value);
      }
    } else if (promo.promoType === 'lifestyle' || promo.promoType === 'bulk') {
      disc = promo.discountType === 'percentage' ? (price * (promo.discountValue / 100)) : Math.min(price, promo.discountValue);
    } else if (promo.promoType === 'bogo') {
      if (bookingMode === 'package') {
        // For packages, BOGO either doubles the classes or adds a second person.
        // If 'person' is chosen and 2 children are selected, the discount is 1 plan price.
        if (bogoOption === 'person' && selectedChildrenIds.length >= 2) {
          disc = selectedPlan?.price || 0;
        } else {
          disc = 0; // Value is doubled internally, price remains for 1
        }
      } else {
        const units = totalParticipants * (selectedSessions?.length || 1);
        if (units < 2) return 0;
        const numFree = Math.floor(units / 2);
        disc = numFree * (selectedClass?.price || 0);
      }
    }
    return Math.round(disc * 100) / 100;
  };

  useEffect(() => {
    if (selectedPromo) {
      setDiscountAmount(calculateDiscount(selectedPromo, currentPrice));
    } else {
      setDiscountAmount(0);
    }
  }, [selectedPromo, currentPrice, bogoOption, selectedChildrenIds.length, totalParticipants]);

  // Reset preferred slots when plan changes
  useEffect(() => {
    if (selectedPlan) {
      setPreferredSlots(selectedPlan.timeSlots?.[0] ? [selectedPlan.timeSlots[0]] : []);
    }
  }, [selectedPlan]);

  // Fetch initial data
  useEffect(() => {
    api.get('/classes')
      .then(res => setClasses(res.data))
      .catch(err => console.error(err));

    api.get('/locations?activeClasses=true')
      .then(res => setLocations(res.data))
      .catch(err => console.error(err));

    api.get('/plans')
      .then(res => setPlans(res.data || []))
      .catch(err => console.error(err));
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced autosuggest
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/users/suggest?query=${encodeURIComponent(searchQuery)}`);
        setSuggestions(res.data || []);
        setShowSuggestions((res.data || []).length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSuggestion = async (user) => {
    setShowSuggestions(false);
    setSearchQuery(user.email || user.phone || '');
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/users/lookup?query=${encodeURIComponent(user.email || user.phone)}`);
      setCustomer(res.data.user);
      setAvailableChildren(res.data.children || []);
      setSelectedChildrenIds([]);
      setStep(2);
      toast.success(`Customer found: ${res.data.user.name}`);
    } catch {
      setError('Could not load customer. Try searching manually.');
    } finally {
      setLoading(false);
    }
  };

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

  // Step 1.5 -> Save customer to DB, then go to Step 2
  const handleRegisterCustomer = async () => {
    if (!newCustomer.name || (!newCustomer.email && !newCustomer.phone)) {
      setError('Name and either Email or Phone are required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/users/walking', {
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        children: []
      });
      const savedUser = res.data.user;
      const savedChildren = res.data.children || [];
      setCustomer(savedUser);
      setAvailableChildren(savedChildren);
      setSelectedChildrenIds([]);
      toast.success(`Customer saved: ${savedUser.name}`);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 -> Save new children to DB, then go to Step 3
  const handleSaveParticipants = async () => {
    const hasSelection = selectedChildrenIds.length > 0 || newChildren.length > 0;
    if (!hasSelection) {
      setError('Please select or add at least one participant.');
      return;
    }
    // Validate new children rows
    for (const nc of newChildren) {
      if (!nc.name || !nc.age) {
        setError('Please fill in name and age for all new participants.');
        return;
      }
    }
    setError('');
    if (newChildren.length === 0) {
      setStep(3);
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/users/walking', {
        name: customer?.name || newCustomer.name,
        email: customer?.email || newCustomer.email,
        phone: customer?.phone || newCustomer.phone,
        children: newChildren
      });
      const allChildren = res.data.children || [];
      setAvailableChildren(allChildren);
      // Auto-select the newly created children
      const existingIds = new Set(selectedChildrenIds);
      const newlyCreated = allChildren.filter(c => !existingIds.has(c._id));
      setSelectedChildrenIds([...selectedChildrenIds, ...newlyCreated.map(c => c._id)]);
      setNewChildren([]); // Clear the form rows - they are now in availableChildren
      toast.success(`${newlyCreated.length} participant(s) saved.`);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save participants.');
    } finally {
      setLoading(false);
    }
  };

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

  // Package membership purchase (skips trainer/session steps)
  const handlePackagePurchase = async () => {
    setLoading(true);
    setError('');
    try {
      const finalUser = customer;
      if (!finalUser?._id) throw new Error('Customer not found. Please go back to Step 1.');
      if (!selectedPlan) throw new Error('No package selected.');
      if (!selectedChildrenIds.length) throw new Error('Please select at least one participant.');

      const reference = `DESK-${Date.now()}`;
      const pmMap = { cash: 'center_cash', card: 'center_card', online: 'online_bank' };

      // 1. Create payment record
      const payRes = await api.post('/payments', {
        planId: selectedPlan._id,
        amount: currentPrice - discountAmount,
        paymentMethod: pmMap[paymentMethod] || 'center_cash',
        reference,
        transactionId: (paymentMethod !== 'cash') ? transactionId : undefined,
        userId: finalUser._id,
        promotionId: selectedPromo?._id
      });

      // 2. Create membership for the first selected child
      const primaryChildId = selectedChildrenIds[0];
      const isDoubled = selectedPromo?.promoType === 'bogo' && bogoOption === 'double';
      const isSiblingBogo = selectedPromo?.promoType === 'bogo' && bogoOption === 'person' && selectedChildrenIds.length >= 2;

      await api.post('/memberships', {
        planId: selectedPlan._id,
        paymentId: payRes.data._id,
        childId: primaryChildId,
        userId: finalUser._id,
        preferredDays,
        preferredSlots,
        sessionsPerWeek,
        claimBogo: isDoubled || isSiblingBogo,
        bogoChildId: isDoubled ? primaryChildId : (isSiblingBogo ? selectedChildrenIds[1] : undefined)
      });

      setCreatedBookings([{ bookingNumber: `MBR-${reference}`, _id: payRes.data._id }]);
      setStep(6);
      toast.success('Membership package purchased!');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Purchase failed');
      toast.error('Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalBooking = async () => {
    setLoading(true);
    setError('');
    try {
      // Customer and children are ALREADY saved in DB from previous steps.
      // Just map selected participants from the already-loaded availableChildren list.
      const finalUser = customer;
      if (!finalUser?._id) {
        throw new Error('Customer not found. Please go back to Step 1.');
      }

      const participants = [];
      selectedChildrenIds.forEach(id => {
        const c = (availableChildren || []).find(ac => ac._id === id);
        if (c) participants.push({ name: c.name, age: c.age, gender: c.gender, childId: c._id });
      });

      if (participants.length === 0) {
        throw new Error('Please select at least one participant in Step 2.');
      }

      // Create Bookings
      const payload = {
        participants,
        classId: selectedClass._id,
        sessions: selectedSessions.map(s => s._id),
        locationId: selectedLocation,
        paymentMethod: paymentMethod === 'cash' ? 'center_cash' : (paymentMethod === 'card' ? 'center_card' : 'online_bank'),
        transactionId: (paymentMethod === 'card' || paymentMethod === 'online') ? transactionId : '',
        paymentStatus: 'completed',
        userId: finalUser._id
      };

      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/bookings/bulk`, payload);
      setCreatedBookings(response.data.data || []);
      setStep(8);
      toast.success('Walking booking completed!');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Booking failed');
      toast.error('Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAddChildSummary = (id) => {
    if (!selectedChildrenIds.includes(id)) {
      setSelectedChildrenIds([...selectedChildrenIds, id]);
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
            <div className="absolute top-1/2 left-0 h-1 bg-brand-blue -z-10 -translate-y-1/2 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 7) * 100}%` }}></div>
            {[1, 2, 3, 4, 5, 6, 7].map(s => (
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

                <div className="flex flex-col md:flex-row gap-4 relative" ref={searchRef}>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Email or Phone number"
                      className="w-full bg-slate-50 border-none rounded-2xl py-5 px-8 text-lg font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      autoComplete="off"
                    />
                    {showSuggestions && (
                      <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-rise">
                        {suggestions.map((s) => (
                          <button
                            key={s._id}
                            onMouseDown={() => handleSelectSuggestion(s)}
                            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 text-left transition-colors border-b border-slate-50 last:border-b-0"
                          >
                            <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-black text-sm shrink-0">
                              {s.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="overflow-hidden">
                              <p className="font-black text-ink truncate">{s.name}</p>
                              <div className="flex items-center gap-3 text-[10px] font-bold">
                                {s.email && (
                                  <span className={`truncate max-w-[150px] ${searchQuery && s.email.toLowerCase().includes(searchQuery.toLowerCase()) ? 'text-brand-blue' : 'text-ink/40'}`}>
                                    {s.email}
                                  </span>
                                )}
                                {s.email && s.phone && <span className="w-1 h-1 rounded-full bg-slate-300"></span>}
                                {s.phone && (
                                  <span className={searchQuery && s.phone.includes(searchQuery) ? 'text-brand-blue' : 'text-ink/40'}>
                                    {s.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="ml-auto text-[10px] font-black text-brand-blue uppercase tracking-widest shrink-0">Select →</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={handleLookup} className="bg-brand-blue text-white px-10 py-5 rounded-2xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all text-lg shrink-0">Find Customer</button>
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
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
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
                        onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-ink/40 uppercase tracking-[0.2em] mb-3 px-1">Phone Number</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none"
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
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
                  <div className="flex flex-col items-end gap-2">
                    {newChildren.length > 0 && (
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        {newChildren.length} new participant(s) will be saved on next step
                      </p>
                    )}
                    <button
                      onClick={handleSaveParticipants}
                      disabled={selectedChildrenIds.length === 0 && newChildren.length === 0}
                      className="bg-brand-blue text-white px-12 py-4 rounded-full font-black shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                    >
                      Save & Select Program →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: PROGRAM / PACKAGE SELECTION */}
            {step === 3 && (
              <div className="animate-rise">
                <h2 className="font-display text-3xl font-black text-ink mb-6">Select Program</h2>

                {/* Mode Tabs */}
                <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl mb-8">
                  <button
                    onClick={() => { setBookingMode('class'); setSelectedPlan(null); }}
                    className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${bookingMode === 'class' ? 'bg-white text-brand-blue shadow-sm' : 'text-ink/40 hover:text-ink'}`}
                  >
                    🎯 Per Session (Classes)
                  </button>
                  <button
                    onClick={() => { setBookingMode('package'); setSelectedClass(null); }}
                    className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${bookingMode === 'package' ? 'bg-white text-brand-blue shadow-sm' : 'text-ink/40 hover:text-ink'}`}
                  >
                    📦 Membership Package
                  </button>
                </div>

                {/* Classes Grid */}
                {bookingMode === 'class' && (
                  <div className="grid gap-6 md:grid-cols-2">
                    {classes.map(c => (
                      <div
                        key={c._id}
                        onClick={() => { setSelectedClass(c); setStep(4); }}
                        className={`p-8 rounded-[36px] border-2 transition-all bg-white text-left group flex flex-col justify-between h-full cursor-pointer relative overflow-hidden ${selectedClass?._id === c._id ? 'border-brand-blue shadow-xl bg-brand-blue/5' : 'border-slate-50 hover:border-brand-blue/30 shadow-sm'}`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="bg-ocean/10 text-ocean text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">{c.ageGroup}</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); setDetailsClass(c); }}
                                className="p-1.5 rounded-full bg-slate-50 text-ink/30 hover:text-brand-blue hover:bg-brand-blue/5 transition-all"
                                title="View Details"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </button>
                              {selectedClass?._id === c._id && <span className="text-brand-blue font-black animate-scale-up">✓</span>}
                            </div>
                          </div>
                          <h3 className="font-display text-2xl group-hover:text-brand-blue transition-colors leading-tight">{c.title}</h3>
                          <p className="mt-3 text-sm text-ink/50 line-clamp-2 leading-relaxed">{c.description}</p>
                        </div>
                        <div className="mt-8 flex items-end justify-between">
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-ink">AED {c.price}</span>
                            <span className="text-xs font-bold text-ink/30 uppercase">/ session</span>
                          </div>
                          <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">Select →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Packages Grid */}
                {bookingMode === 'package' && (
                  <div className="grid gap-5 md:grid-cols-2">
                    {plans.length === 0 && (
                      <p className="col-span-2 text-sm text-ink/40 font-bold text-center py-12">No packages available for this location.</p>
                    )}
                    {plans.map(plan => (
                      <div
                        key={plan._id}
                        onClick={() => setSelectedPlan(plan._id === selectedPlan?._id ? null : plan)}
                        className={`p-7 rounded-[32px] border-2 transition-all text-left flex flex-col justify-between cursor-pointer relative overflow-hidden group ${selectedPlan?._id === plan._id
                          ? 'border-brand-blue bg-brand-blue/5 shadow-xl'
                          : 'border-slate-100 bg-white hover:border-brand-blue/30 shadow-sm'
                          }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex flex-wrap gap-2">
                              <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${plan.sessionType === 'personal' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
                                }`}>
                                {plan.sessionType === 'personal' ? 'Personal' : 'Group'}
                              </span>
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-500">
                                {plan.validDays === 'both' ? 'All Days' : plan.validDays === 'weekday' ? 'Weekdays' : 'Weekends'}
                              </span>
                              {plan.isFeatured && (
                                <span className="rounded-full bg-coral/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-coral">Best Value</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); setDetailsPlan(plan); }}
                                className="p-1.5 rounded-full bg-slate-50 text-ink/30 hover:text-brand-blue hover:bg-brand-blue/5 transition-all"
                                title="View Details"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </button>
                              {selectedPlan?._id === plan._id && (
                                <span className="w-7 h-7 rounded-full bg-brand-blue text-white flex items-center justify-center font-black text-sm animate-scale-up">✓</span>
                              )}
                            </div>
                          </div>
                          <h3 className="font-display text-xl font-black text-ink">{plan.name}</h3>
                          {plan.tagline && <p className="text-xs text-ink/50 mt-1 line-clamp-1">{plan.tagline}</p>}
                          <div className="flex items-center gap-4 mt-3 text-xs font-bold text-ink/40">
                            <span className="flex items-center gap-1.5"><span className="opacity-50">📋</span> {plan.classesIncluded || 'Unlimited'} classes</span>
                            {plan.durationWeeks && <span className="flex items-center gap-1.5"><span className="opacity-50">⏱</span> {plan.durationWeeks} weeks</span>}
                          </div>
                        </div>
                        <div className="mt-6 flex items-center justify-between">
                          <span className="text-2xl font-black text-brand-blue">{plan.price.toLocaleString()} <span className="text-xs opacity-50">AED</span></span>
                          <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">Select →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-12 flex items-center justify-between">
                  <button onClick={() => setStep(2)} className="text-sm font-bold text-ink/40 hover:text-ink px-6">Back to participants</button>
                  {bookingMode === 'package' && selectedPlan && (
                    <button
                      onClick={() => setStep(3.5)}
                      className="bg-brand-blue text-white px-10 py-4 rounded-full font-black shadow-lg hover:scale-105 active:scale-95 transition-all"
                    >
                      Configure Schedule →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3.5: MEMBERSHIP SCHEDULE CONFIGURATION */}
            {step === 3.5 && (
              <div className="animate-rise">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand-blue/10 flex items-center justify-center text-2xl">📅</div>
                    <div>
                      <h2 className="font-display text-3xl font-black text-ink">Schedule Configuration</h2>
                      <p className="text-xs font-bold text-ink/40 uppercase tracking-widest mt-1">Setup Weekly Training Routine</p>
                    </div>
                  </div>

                  {selectedPlan && (
                    <div className="bg-slate-100/50 backdrop-blur-sm px-6 py-4 rounded-3xl border border-slate-200 flex items-center gap-6 animate-rise">
                      <div>
                        <p className="text-[10px] font-black text-ink/30 uppercase tracking-widest mb-1">Selected Plan</p>
                        <p className="text-sm font-black text-ink">{selectedPlan.name}</p>
                      </div>
                      <div className="w-px h-8 bg-slate-200" />
                      <div>
                        <p className="text-[10px] font-black text-ink/30 uppercase tracking-widest mb-1">Price</p>
                        <p className="text-sm font-black text-ink">{selectedPlan.price} <span className="text-[10px] opacity-40">AED</span></p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-10">
                  {/* Training Days Selection */}
                  <div className="bg-white p-10 rounded-[44px] border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                      <label className="block text-[10px] font-black text-ink/30 uppercase tracking-[0.2em] px-1">Select Training Days</label>
                      {preferredDays.length > 0 && (
                        <span className="bg-brand-blue/10 text-brand-blue px-3 py-1 rounded-lg text-[10px] font-black uppercase">{preferredDays.length} Days Selected</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                        const isWeekend = day === 'Sat' || day === 'Sun';
                        const isDisabled = (selectedPlan?.validDays === 'weekday' && isWeekend) || (selectedPlan?.validDays === 'weekend' && !isWeekend);
                        const isSelected = preferredDays.includes(day);

                        return (
                          <button
                            key={day}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => setPreferredDays(prev => isSelected ? prev.filter(d => d !== day) : [...prev, day])}
                            className={`px-8 py-5 rounded-3xl text-sm font-black transition-all ${isDisabled ? 'opacity-20 grayscale cursor-not-allowed bg-slate-50 border-transparent' :
                              isSelected ? 'bg-brand-blue text-white shadow-xl shadow-brand-blue/20 ring-8 ring-brand-blue/5' : 'bg-slate-50 text-ink/30 hover:bg-slate-100 border border-slate-100 hover:text-ink/60'
                              }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                    <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-brand-blue/5 rounded-full blur-3xl pointer-events-none" />
                  </div>

                  {/* Time Slot Selection */}
                  <div className="bg-white p-10 rounded-[44px] border border-slate-100 shadow-sm relative overflow-hidden">
                    <label className="block text-[10px] font-black text-ink/30 uppercase tracking-[0.2em] mb-8 px-1">Select Preferred Slot</label>
                    {selectedPlan?.timeSlots?.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {selectedPlan.timeSlots.map(slot => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setPreferredSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot])}
                            className={`px-7 py-4 rounded-2xl text-sm font-black transition-all flex items-center gap-3 ${preferredSlots.includes(slot) ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-50 text-ink/40 hover:bg-slate-100 border border-slate-100'
                              }`}
                          >
                            <span className="opacity-50 text-base">⏰</span> {slot}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="py-10 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                        <p className="text-sm font-bold text-ink/20 italic">No specific slots defined for this plan. All times allowed.</p>
                      </div>
                    )}
                  </div>

                  {/* Footer Navigation */}
                  <div className="mt-12 flex items-center justify-between px-4">
                    <button onClick={() => setStep(3)} className="text-sm font-bold text-ink/40 hover:text-ink transition-colors px-6">Back to packages</button>
                    <button
                      onClick={() => setStep(6)}
                      disabled={preferredDays.length === 0}
                      className="bg-brand-blue text-white px-12 py-5 rounded-full font-display text-xl font-black shadow-glow-blue hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                    >
                      Continue to Final Review →
                    </button>
                  </div>
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
                <p className="text-ink/60 mb-8">{selectedClass?.title} with {trainers.find(t => t._id === selectedTrainer)?.name}</p>

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

            {/* STEP 6: SUMMARY & BOGO BONUS */}
            {step === 6 && (
              <div className="animate-rise py-4">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  {/* Left Column: Detailed Summary */}
                  <div className="flex-1 space-y-8">
                    <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
                      <div className="flex items-start justify-between mb-8">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/30 mb-2">{bookingMode === 'package' ? 'Package Details' : 'Program Details'}</p>
                          <h3 className="font-display text-4xl font-black text-ink">
                            {bookingMode === 'package' ? selectedPlan?.name : selectedClass?.title}
                          </h3>
                        </div>
                        <div className="text-right">
                          <p className="text-4xl font-black text-ink">AED {currentPrice.toLocaleString()}</p>
                          <p className="text-[10px] font-black text-ink/30 uppercase tracking-widest mt-1">Total inclusive order</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-slate-50 p-6 rounded-3xl">
                          <p className="text-[10px] font-black uppercase tracking-widest text-ink/30 mb-4">Participants ({totalParticipants})</p>
                          <div className="space-y-3">
                            {selectedChildrenIds.map(id => availableChildren.find(c => c._id === id)).map((p, i) => (
                              <div key={i} className="flex justify-between items-center text-sm font-bold">
                                <span>{p?.name}</span>
                                <span className="opacity-40">{p?.age} Yrs</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-3xl">
                          <p className="text-[10px] font-black uppercase tracking-widest text-ink/30 mb-4">Service Details</p>
                          {bookingMode === 'package' ? (
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-sm">🗓️</span>
                                <p className="text-xs font-bold text-ink/70">{selectedPlan?.classesIncluded || 'Unlimited'} Classes</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-sm">⏱</span>
                                <p className="text-xs font-bold text-ink/70">{selectedPlan?.durationWeeks || '—'} Weeks Validity</p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {selectedSessions.map((s, i) => (
                                <div key={i} className="text-[11px] font-bold text-ink/60">
                                  {new Date(s.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} @ {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {discountAmount > 0 && (
                        <div className="mt-8 p-6 bg-emerald-50 rounded-3xl flex items-center justify-between border border-emerald-100/50">
                          <div className="flex items-center gap-4">
                            <span className="text-2xl">🎁</span>
                            <div>
                              <p className="text-[10px] font-black text-emerald-700 uppercase">Promotion Applied</p>
                              <p className="text-xs font-black text-emerald-600">{selectedPromo?.name}</p>
                            </div>
                          </div>
                          <p className="text-xl font-black text-emerald-700">- AED {discountAmount}</p>
                        </div>
                      )}
                    </div>

                    {applicablePromos.length > 0 && (
                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-ink/30 px-6">Available Promotions</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {applicablePromos.map(promo => (
                            <button
                              key={promo._id}
                              onClick={() => setSelectedPromo(selectedPromo?._id === promo._id ? null : promo)}
                              className={`p-6 rounded-[32px] border-2 transition-all flex items-center justify-between group ${selectedPromo?._id === promo._id ? 'border-brand-blue bg-white shadow-xl shadow-brand-blue/5' : 'border-slate-100 bg-white hover:border-brand-blue/20'}`}
                            >
                              <div className="flex items-center gap-4 text-left">
                                <span className="text-2xl">{promo.promoType === 'bogo' ? '🔥' : '🏷️'}</span>
                                <div>
                                  <p className="font-black text-ink text-sm uppercase leading-tight">{promo.name}</p>
                                  <p className="text-[10px] font-bold text-brand-blue mt-1">Save AED {calculateDiscount(promo, currentPrice)}</p>
                                </div>
                              </div>
                              {selectedPromo?._id === promo._id && <span className="text-brand-blue font-black animate-scale-up">✓</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Sidebar: Dynamic Actions */}
                  <div className="w-full lg:w-[380px] shrink-0">
                    <div className="bg-ink p-10 py-12 rounded-[56px] shadow-2xl shadow-ink/30 sticky top-8 animate-rise text-white">
                      <div className="mb-10 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Order Review</p>
                        <h2 className="font-display text-3xl font-black text-white px-2">
                          {selectedPromo?.promoType === 'bogo' ? 'Claim Bonus' : 'Confirm Order'}
                        </h2>
                      </div>

                      <div className="space-y-6 flex-1 min-h-[300px]">
                        {selectedPromo?.promoType === 'bogo' ? (
                          <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 animate-in zoom-in-95 duration-500">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-6 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                              BOGO Assistant Ready
                            </p>
                            <div className="space-y-3">
                              {selectedChildrenIds.length > 0 && bookingMode === 'package' && (
                                <button
                                  onClick={() => {
                                    setBogoOption('double');
                                    if (selectedChildrenIds.length > 1) setSelectedChildrenIds([selectedChildrenIds[0]]);
                                  }}
                                  className={`w-full p-5 rounded-3xl border-2 transition-all flex items-center gap-4 text-left group ${bogoOption === 'double' && selectedChildrenIds.length === 1 ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                                >
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all ${bogoOption === 'double' && selectedChildrenIds.length === 1 ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/20'}`}>⚡</div>
                                  <div>
                                    <p className="font-black text-white text-[11px] uppercase tracking-wide">Double sessions for {availableChildren.find(c => c._id === selectedChildrenIds[0])?.name}</p>
                                    <p className="text-[9px] font-bold text-white/40 mt-1 uppercase">Recommended for individuals</p>
                                  </div>
                                </button>
                              )}

                              {availableChildren.filter(child => !selectedChildrenIds.includes(child._id)).map(child => (
                                <button
                                  key={child._id}
                                  onClick={() => { setBogoOption('person'); handleQuickAddChildSummary(child._id); }}
                                  className="w-full p-5 rounded-3xl border-2 border-white/5 bg-white/5 hover:border-white/20 transition-all flex items-center gap-4 text-left group"
                                >
                                  <div className="w-12 h-12 rounded-2xl bg-white/5 text-white/20 group-hover:bg-brand-blue group-hover:text-white transition-all flex items-center justify-center text-2xl">➕</div>
                                  <div>
                                    <p className="font-black text-white text-[11px] uppercase tracking-wide">Add {child.name} for Free</p>
                                    <p className="text-[9px] font-bold text-white/40 mt-1 uppercase text-brand-blue">Claim 1 Free Slot</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-white/5 rounded-[48px] py-12 px-10 text-center">
                            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-3xl">📝</div>
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60 mb-2">Review Complete</p>
                            <p className="text-[10px] font-bold text-white/30 leading-relaxed px-4">All participants and schedules have been verified. Standard promotion active.</p>
                          </div>
                        )}
                      </div>

                      <div className="mt-12 pt-8 border-t border-white/5">
                        <button
                          onClick={() => setStep(7)}
                          className="w-full bg-brand-blue text-white py-6 rounded-[32px] font-display text-xl font-black shadow-xl shadow-brand-blue/20 hover:scale-[1.03] active:scale-[0.97] transition-all"
                        >
                          Proceed to Payment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: PAYMENT SELECTION */}
            {step === 7 && (
              <div className="animate-rise py-4">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  {/* Left Column: Final Summary */}
                  <div className="flex-1 space-y-8">
                    <div className="bg-white p-12 rounded-[56px] border border-slate-100 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-10 opacity-5">
                        <span className="text-[120px] font-black">AED</span>
                      </div>

                      <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/30 mb-10 text-center">Final Invoicing Summary</p>

                        <div className="flex flex-col items-center justify-center border-b border-slate-100 pb-10 mb-10">
                          <p className="text-[10px] font-black text-brand-blue uppercase tracking-[0.3em] mb-3">Amount to be Paid</p>
                          <h2 className="font-display text-7xl font-black text-ink">AED {currentPrice - discountAmount}</h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-10">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-ink/30 mb-4">Transaction Components</p>
                            <div className="space-y-4">
                              <div className="flex justify-between text-sm font-bold opacity-60">
                                <span>Base Order ({totalParticipants} members)</span>
                                <span>AED {currentPrice}</span>
                              </div>
                              {discountAmount > 0 && (
                                <div className="flex justify-between text-sm font-black text-emerald-600">
                                  <span>Total Savings ({selectedPromo?.name})</span>
                                  <span>- AED {discountAmount}</span>
                                </div>
                              )}
                              <div className="h-px bg-slate-100 mt-4"></div>
                              <div className="flex justify-between text-lg font-black text-brand-blue pt-2">
                                <span>Grand Total</span>
                                <span>AED {currentPrice - discountAmount}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-ink/30 mb-4">Payment Receipting</p>
                            <p className="text-xs text-ink/40 leading-relaxed font-bold">Please select the physical payment method used. The transaction will be logged in the system ledger once confirmed.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Sidebar: Payment Modes */}
                  <div className="w-full lg:w-[380px] shrink-0">
                    <div className="bg-ink p-10 py-12 rounded-[56px] shadow-2xl shadow-ink/30 sticky top-8 animate-rise text-white">
                      <div className="mb-10 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Step 7 of 7</p>
                        <h2 className="font-display text-3xl font-black text-white px-2">Finalize Payment</h2>
                      </div>

                      <div className="space-y-3 mb-10">
                        {['cash', 'card', 'online'].map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setPaymentMethod(mode)}
                            className={`w-full p-6 rounded-[32px] border-2 transition-all flex items-center justify-between group ${paymentMethod === mode ? 'border-brand-blue bg-white/10' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                          >
                            <div className="flex items-center gap-5">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all ${paymentMethod === mode ? 'bg-brand-blue text-white' : 'bg-white/5 text-white/30 group-hover:text-white'}`}>
                                {mode === 'cash' ? '💵' : mode === 'card' ? '💳' : '🌐'}
                              </div>
                              <span className="font-black uppercase tracking-widest text-xs">{mode}</span>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === mode ? 'border-brand-blue border-brand-blue text-white shadow-lg' : 'border-white/10'}`}>
                              {paymentMethod === mode && '✓'}
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className="space-y-4">
                        <button
                          onClick={bookingMode === 'package' ? handlePackagePurchase : handleFinalBooking}
                          disabled={loading || !paymentMethod}
                          className="w-full bg-brand-blue text-white py-6 rounded-[32px] font-display text-xl font-black shadow-xl shadow-brand-blue/20 hover:scale-[1.03] active:scale-[0.97] transition-all disabled:opacity-50"
                        >
                          {loading ? 'Finalizing...' : (bookingMode === 'package' ? 'Purchase Membership' : 'Confirm & Buy')}
                        </button>
                        <button
                          onClick={() => setStep(6)}
                          className="w-full py-2 text-[10px] font-black text-white/20 hover:text-white/60 transition-colors uppercase tracking-[0.2em]"
                        >
                          🔙 Back to Summary
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: SUCCESS */}
            {step === 8 && (
              <div className="animate-rise py-4">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  {/* Left Column: Confirmation Summary */}
                  <div className="flex-1 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Card 1: Customer Details */}
                      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/30 mb-6">Confirmed Customer</p>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xl">👤</div>
                          <div>
                            <h4 className="font-display text-lg font-black text-ink">{customer?.name || newCustomer?.name}</h4>
                            <p className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mt-1">Primary Account Holder</p>
                          </div>
                        </div>
                      </div>

                      {/* Card 2: Plan/Booking Info */}
                      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/30 mb-6">Service Summary</p>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">✨</div>
                          <div>
                            <h4 className="font-display text-lg font-black text-ink">{selectedPlan?.name || selectedClass?.title}</h4>
                            <p className="text-[10px] font-bold text-indigo-600/60 uppercase tracking-widest mt-1">AED {currentPrice - discountAmount} • {paymentMethod.toUpperCase()}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Official Records / Invoices */}
                    <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
                      <div className="flex items-end justify-between mb-8">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/30 mb-2">Internal Records</p>
                          <h3 className="font-display text-2xl font-black text-ink">Official Documentation</h3>
                        </div>
                        {createdBookings.length > 1 && (
                          <span className="bg-slate-50 text-ink/30 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {createdBookings.length} Bookings Linked
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {createdBookings.map((b, i) => (
                          <div key={i} className="group p-5 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row items-center justify-between hover:bg-white hover:border-brand-blue hover:shadow-lg transition-all gap-4">
                            <div className="flex items-center gap-5">
                              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📄</div>
                              <div>
                                <p className="text-[10px] font-black text-ink/30 uppercase tracking-[0.15em] mb-1">Booking Reference</p>
                                <p className="text-sm font-black text-brand-blue tracking-wider">{b.bookingNumber}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                              <button
                                onClick={() => window.open(`/invoice/booking/${b._id}`, '_blank')}
                                className="flex-1 sm:flex-initial bg-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] text-brand-blue border border-slate-200 hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-all"
                              >
                                View Invoice
                              </button>
                              <button
                                onClick={() => window.print()}
                                className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-lg hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-all"
                                title="Download Local Copy"
                              >
                                💾
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions Sidebar (Mirroring Step 6) */}
                  <div className="w-full lg:w-[380px] shrink-0">
                    <div className="bg-ink p-10 py-12 rounded-[56px] shadow-2xl shadow-ink/30 sticky top-8 animate-rise">
                      <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-emerald-500 text-white rounded-[28px] flex items-center justify-center text-4xl mx-auto mb-6 shadow-xl shadow-emerald-500/20 animate-bounce">✓</div>
                        <h2 className="font-display text-3xl font-black text-white mb-2">Confirmed!</h2>
                        <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest leading-relaxed">The booking has been successfully recorded in the system.</p>
                      </div>

                      <div className="space-y-4">
                        <button
                          onClick={() => window.location.reload()}
                          className="w-full bg-brand-blue text-white py-6 rounded-[32px] font-display text-xl font-black shadow-xl shadow-brand-blue/20 hover:scale-[1.03] active:scale-[0.97] transition-all"
                        >
                          Start New Booking
                        </button>

                        <button
                          onClick={() => navigate(`/${roleSlug}/bookings`)}
                          className="w-full py-4 text-xs font-black text-white/30 hover:text-white transition-colors uppercase tracking-[0.2em]"
                        >
                          Review All Bookings
                        </button>
                      </div>

                      <div className="mt-12 pt-8 border-t border-white/5 space-y-4">
                        <div className="flex items-center justify-between text-white/40">
                          <span className="text-[10px] font-black uppercase tracking-widest">Transaction Mode</span>
                          <span className="text-[10px] font-black uppercase">{paymentMethod}</span>
                        </div>
                        <div className="flex items-center justify-between text-white/40">
                          <span className="text-[10px] font-black uppercase tracking-widest">Handled By</span>
                          <span className="text-[10px] font-black uppercase">{staff?.name || 'Authorized Staff'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── View Details Modals ── */}
      {(detailsClass || detailsPlan) && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fade-in" onClick={() => { setDetailsClass(null); setDetailsPlan(null); }}>
          <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-rise" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={`relative p-8 text-white ${detailsClass ? 'bg-gradient-to-br from-brand-blue to-ocean' : 'bg-gradient-to-br from-indigo-600 to-brand-blue'}`}>
              <button onClick={() => { setDetailsClass(null); setDetailsPlan(null); }} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-black transition-all border border-white/10">×</button>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                  {detailsClass ? 'Class Program' : 'Membership Plan'}
                </span>
                {detailsClass && (
                  <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest">{detailsClass.ageGroup}</span>
                )}
                {detailsPlan && (
                  <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                    {detailsPlan.sessionType === 'personal' ? 'Personal' : 'Group'}
                  </span>
                )}
              </div>

              <h2 className="font-display text-4xl font-black">{detailsClass?.title || detailsPlan?.name}</h2>
              {(detailsClass?.description || detailsPlan?.tagline) && (
                <p className="mt-2 text-white/70 text-sm font-medium leading-relaxed">
                  {detailsClass?.description || detailsPlan?.tagline}
                </p>
              )}

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-black">AED {detailsClass?.price || detailsPlan?.price}</span>
                <span className="text-white/60 text-sm font-bold uppercase tracking-widest">
                  {detailsClass ? '/ session' : `/ ${detailsPlan?.validity || 'period'}`}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-8 space-y-8 max-h-[50vh] overflow-y-auto scrollbar-hide">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                {detailsClass && (
                  <>
                    <div className="rounded-2xl bg-slate-50 p-5">
                      <p className="text-[10px] font-black uppercase text-ink/30 mb-1 tracking-widest">Duration</p>
                      <p className="text-lg font-black text-ink">{detailsClass.duration || 'Session'}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-5">
                      <p className="text-[10px] font-black uppercase text-ink/30 mb-1 tracking-widest">Ages</p>
                      <p className="text-lg font-black text-ink">{detailsClass.minAge || 'all'} - {detailsClass.maxAge || 'all'} Yrs</p>
                    </div>
                  </>
                )}
                {detailsPlan && (
                  <>
                    <div className="rounded-2xl bg-slate-50 p-5">
                      <p className="text-[10px] font-black uppercase text-ink/30 mb-1 tracking-widest">Classes</p>
                      <p className="text-lg font-black text-ink">{detailsPlan.classesIncluded || 'Unlimited'}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-5">
                      <p className="text-[10px] font-black uppercase text-ink/30 mb-1 tracking-widest">Duration</p>
                      <p className="text-lg font-black text-ink">{detailsPlan.durationWeeks || '—'} Weeks</p>
                    </div>
                  </>
                )}
              </div>

              {/* Benefits / Info */}
              {(detailsPlan?.benefits?.length > 0 || detailsClass?.genderRestriction || detailsPlan?.timeSlots?.length > 0) && (
                <div className="space-y-6">
                  {(detailsPlan?.benefits?.length > 0 || detailsClass?.genderRestriction) && (
                    <div>
                      <p className="text-[10px] font-black uppercase text-ink/30 mb-4 tracking-widest">Details & Perks</p>
                      <div className="space-y-3">
                        {detailsClass?.genderRestriction && detailsClass.genderRestriction !== 'any' && (
                          <div className="flex items-center gap-3 text-sm font-bold text-ink/70">
                            <span className="w-2 h-2 rounded-full bg-coral shrink-0" />
                            Restricted to: <span className="text-coral uppercase">{detailsClass.genderRestriction}</span>
                          </div>
                        )}
                        {detailsPlan?.benefits?.map((b, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm font-bold text-ink/70">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />{b}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {detailsPlan?.timeSlots?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase text-ink/30 mb-4 tracking-widest">Available Time Slots</p>
                      <div className="flex flex-wrap gap-2">
                        {detailsPlan.timeSlots.map((slot, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-black ring-1 ring-indigo-100 flex items-center gap-1.5">
                            <span className="opacity-50 text-[10px]">⏰</span> {slot}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Policy Section for Plans */}
              {detailsPlan && (
                <div className="space-y-4">
                  {detailsPlan.extensionRules && (
                    <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Rescue Policy</p>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-[10px] font-black text-emerald-600 uppercase">Inclusive</span>
                      </div>
                      <p className="text-sm font-bold text-ink/70">
                        Members can rescue up to <span className="text-emerald-600">{detailsPlan.extensionRules.maxAllowedMissed} missed sessions</span> within {detailsPlan.extensionRules.expiryBufferDays} days of plan expiry.
                      </p>
                    </div>
                  )}
                  <div className="rounded-2xl bg-slate-50 p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shrink-0 shadow-sm">
                      {detailsPlan.trainerAllocation === 'fixed' ? '📌' : '🎲'}
                    </div>
                    <div>
                      <p className="font-black text-ink text-sm">{detailsPlan.trainerAllocation === 'fixed' ? 'Dedicated Trainer' : 'Flexible Coaching'}</p>
                      <p className="text-xs text-ink/50 mt-1 leading-relaxed font-medium">
                        {detailsPlan.trainerAllocation === 'fixed'
                          ? `This plan includes the dedicated support of ${detailsPlan.trainerId?.name || 'an assigned coach'} for all sessions.`
                          : 'Sessions are assigned to available coaches on rotation to provide diverse training styles.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-50">
              <button
                onClick={() => {
                  if (detailsClass) { setSelectedClass(detailsClass); setStep(4); }
                  if (detailsPlan) { setSelectedPlan(detailsPlan); }
                  setDetailsClass(null);
                  setDetailsPlan(null);
                }}
                className={`w-full py-4 rounded-2xl text-white font-black text-sm uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all ${detailsClass ? 'bg-brand-blue shadow-brand-blue/20' : 'bg-indigo-600 shadow-indigo-600/20'}`}
              >
                Select & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
