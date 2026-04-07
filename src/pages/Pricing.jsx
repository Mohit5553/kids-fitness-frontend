import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api.js';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import SectionTitle from '../components/SectionTitle.jsx';
import LocationPicker from '../components/LocationPicker.jsx';
import { getUser } from '../utils/auth.js';
import { getLocationId } from '../utils/location.js';

export default function Pricing() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Checkout State
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [preferredDays, setPreferredDays] = useState([]);
  const [preferredSlots, setPreferredSlots] = useState([]); // Array of strings
  const [cardForm, setCardForm] = useState({ name: '', number: '', expiry: '', cvc: '' });
  const [detailsPlan, setDetailsPlan] = useState(null);

  const fetchPlans = async () => {
    try {
      const locationId = getLocationId();
      const res = await api.get('/plans', { params: { locationId } });
      setPlans(res.data);
    } catch (err) {
      console.error('Failed to fetch plans', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    const handleChange = () => fetchPlans();
    window.addEventListener('location-change', handleChange);
    return () => window.removeEventListener('location-change', handleChange);
  }, []);

  const openCheckout = (plan) => {
    if (!getUser()) {
      navigate('/login?redirect=/pricing');
      return;
    }
    setSelectedPlan(plan);
    setShowCheckout(true);
    setMessage('');
    setError('');
    
    // Fetch children for selection
    api.get('/children/mine').then(res => {
      setChildren(res.data || []);
      if (res.data?.length > 0) setSelectedChildId(res.data[0]._id);
    }).catch(() => {});
  };

  const closeCheckout = () => {
    setShowCheckout(false);
    setSelectedPlan(null);
    setCardForm({ name: '', number: '', expiry: '', cvc: '' });
  };

  const handleCardChange = (event) => {
    let { name, value } = event.target;
    if (name === 'number') {
      value = value.replace(/\D/g, '').slice(0, 16);
      value = value.match(/.{1,4}/g)?.join(' ') || value;
    }
    if (name === 'expiry') {
      value = value.replace(/\D/g, '').slice(0, 4);
      if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
    }
    if (name === 'cvc') {
      value = value.replace(/\D/g, '').slice(0, 4);
    }
    setCardForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!selectedPlan) return;
    if (!cardForm.name || !cardForm.number || !cardForm.expiry || !cardForm.cvc) {
      setError('Please complete card details.');
      return;
    }

    const last4 = cardForm.number.replace(/\s/g, '').slice(-4);
    const reference = `mock_${Date.now()}`;

    try {
      const payment = await api.post('/payments', {
        planId: selectedPlan._id,
        amount: selectedPlan.price,
        paymentMethod: 'card',
        reference,
        last4
      });

      const membershipRes = await api.post('/memberships', {
        planId: selectedPlan._id,
        paymentId: payment.data._id,
        childId: selectedChildId,
        preferredDays,
        preferredSlots, // Directly passing the array
        sessionsPerWeek: preferredDays.length
      });

      setMessage('Payment successful! Your schedule has been generated.');
      setTimeout(() => {
        closeCheckout();
        navigate('/dashboard'); // Navigate to parent dashboard to see membership
      }, 2000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Payment failed. Try again.');
    }
  };

  const classOptions = plans.filter(p => p.type === 'pack' || p.type === 'subscription');
  const termPricing = plans.filter(p => p.type === 'term');
  const dropIns = plans.filter(p => p.type === 'dropin');

  const minDropIn = dropIns.length > 0
    ? Math.min(...dropIns.map(p => p.price))
    : (plans.find(p => p.type === 'dropin')?.price || 80);
  return (
    <div>
      <Navbar />
      <main className="page-shell pb-12 pt-8">
        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-sky-600 via-blue-600 to-emerald-500 p-8 text-white shadow-glow">
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Pricing</p>
            <h1 className="mt-3 font-display text-3xl md:text-4xl">Other class options</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80">
              Baby classes · Ballet · Combat sports · Fitness. Transparent packages with playful perks.
            </p>
          </div>
          <div className="relative z-10 mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">Drop-ins</p>
              <p className="mt-2 text-xl font-semibold">From {minDropIn} AED</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">Bundles</p>
              <p className="mt-2 text-xl font-semibold">Save 15%</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">Freebies</p>
              <p className="mt-2 text-xl font-semibold">Gym access</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">Coaching</p>
              <p className="mt-2 text-xl font-semibold">Progress notes</p>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/15" />
          <div className="pointer-events-none absolute -bottom-16 left-10 h-44 w-44 rounded-full bg-white/10" />
        </section>

        <div className="mt-6">
          <LocationPicker compact />
        </div>

        <section className="mt-8">
          <SectionTitle
            kicker="Packages"
            title="Pick the plan that fits your rhythm"
            subtitle="Save more with multi-class bundles and enjoy extra perks."
          />
          <div className="grid gap-5 lg:grid-cols-2">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-44 animate-pulse rounded-3xl bg-white/40" />
              ))
            ) : classOptions.length > 0 ? (
              classOptions.map((item) => (
                <div
                  key={item._id}
                  className={`relative overflow-hidden rounded-3xl border ${item.isFeatured ? 'border-coral/40 bg-white shadow-glow' : 'border-white/60 bg-white/80'
                    } p-6`}
                >
                  {item.isFeatured ? (
                    <span className="absolute right-6 top-6 rounded-full bg-coral/15 px-3 py-1 text-xs font-semibold text-coral">
                      Best value
                    </span>
                  ) : null}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${item.sessionType === 'personal' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {item.sessionType || 'Group'} Session
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          {item.validDays === 'both' ? 'All Days' : item.validDays === 'weekday' ? 'Weekdays' : 'Weekends'}
                        </span>
                        {item.locationId?.name && (
                          <span className="rounded-full bg-ocean/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-ocean/80">
                            {item.locationId.name}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-2xl font-black text-ink leading-tight mb-2">{item.name}</h3>
                      <div className="flex items-center gap-4 text-xs font-bold text-ink/40">
                         <span className="flex items-center gap-1.5">
                           <svg className="w-4 h-4 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                           {item.classesIncluded || (item.type === 'dropin' ? '1' : 'Unlimited')} Classes
                         </span>
                         {item.durationWeeks && (
                           <span className="flex items-center gap-1.5">
                             <svg className="w-4 h-4 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                             {item.durationWeeks} Weeks
                           </span>
                         )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-ink/30 mb-1">Price</p>
                      <p className="text-3xl font-black text-brand-blue">
                        {item.price.toLocaleString()}
                        <span className="text-xs ml-1 opacity-40">AED</span>
                      </p>
                    </div>
                  </div>

                  {item.timeSlots && item.timeSlots.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2">
                       {item.timeSlots.map(slot => (
                         <span key={slot} className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-bold text-ink/50 lowercase">
                           {slot}
                         </span>
                       ))}
                    </div>
                  )}

                  {item.benefits && item.benefits.length > 0 ? (
                    <div className="mt-6 border-t border-slate-50 pt-4 flex flex-wrap gap-x-4 gap-y-2">
                      {item.benefits.map((benefit, bi) => (
                        <div key={bi} className="flex items-center gap-2 text-xs font-bold text-ink/60">
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                           {benefit}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setDetailsPlan(item); }}
                      className="flex-1 rounded-2xl bg-slate-100 py-3.5 text-sm font-bold text-ink/70 transition-transform hover:bg-slate-200 active:scale-95"
                    >
                      View Details
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openCheckout(item); }}
                      className="flex-1 rounded-2xl bg-brand-blue py-3.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink/50 md:col-span-2">No class packs available for this location.</p>
            )}
          </div>
        </section>

        <section className="mt-10">
          <div className="section-soft rounded-[32px] p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-moss">Beginners</p>
                <h3 className="mt-3 font-display text-2xl">Price per term</h3>
                <p className="mt-2 text-sm text-ink/70">Structured weekly training with steady progress.</p>
              </div>
              <span className="rounded-full bg-ink/5 px-4 py-2 text-xs font-semibold text-ink">
                + Get FREE 1 month access in 51 Gym
              </span>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {loading ? (
                Array(3).fill(0).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/40" />)
              ) : termPricing.map((term) => (
                <div key={term._id} className="rounded-2xl border border-orange-200/60 bg-white/80 p-5 flex flex-col justify-between">
                  <div>
                    <p className="text-sm text-ink/70">{term.name}</p>
                    <p className="mt-2 text-2xl font-semibold text-ocean">{term.price.toLocaleString()} AED</p>
                  </div>
                  <button
                    onClick={() => openCheckout(term)}
                    className="mt-5 w-full rounded-xl bg-orange-100 py-3 text-sm font-bold text-orange-600 transition-transform hover:bg-orange-200 active:scale-95"
                  >
                    Buy Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── Plan Details Modal ── */}
      {detailsPlan && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-ink/60 backdrop-blur-sm" onClick={() => setDetailsPlan(null)}>
          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="relative bg-gradient-to-br from-brand-blue to-ocean p-8 text-white">
              <button onClick={() => setDetailsPlan(null)} className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-black transition-all">×</button>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${detailsPlan.sessionType === 'personal' ? 'bg-indigo-400/30 text-indigo-100' : 'bg-emerald-400/30 text-emerald-100'}`}>
                  {detailsPlan.sessionType === 'personal' ? 'Personal Training' : 'Group Session'}
                </span>
                <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                  {detailsPlan.validDays === 'both' ? 'All Days' : detailsPlan.validDays === 'weekday' ? 'Weekdays Only' : 'Weekends Only'}
                </span>
              </div>
              <h2 className="font-display text-3xl font-black">{detailsPlan.name}</h2>
              {detailsPlan.tagline && <p className="mt-1 text-white/70 text-sm font-medium">{detailsPlan.tagline}</p>}
              <div className="mt-4">
                <span className="text-4xl font-black">{detailsPlan.price.toLocaleString()}</span>
                <span className="text-white/60 ml-2 text-sm">AED</span>
                {detailsPlan.billingCycle && detailsPlan.billingCycle !== 'none' && (
                  <span className="text-white/60 text-sm ml-1">/ {detailsPlan.billingCycle}</span>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="p-8 space-y-6 max-h-[55vh] overflow-y-auto">
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-slate-50 p-4 text-center">
                  <p className="text-2xl font-black text-brand-blue">{detailsPlan.classesIncluded || (detailsPlan.type === 'dropin' ? 1 : '∞')}</p>
                  <p className="text-[10px] font-black uppercase text-ink/40 mt-1">Classes</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-center">
                  <p className="text-2xl font-black text-brand-blue">{detailsPlan.durationWeeks || '—'}</p>
                  <p className="text-[10px] font-black uppercase text-ink/40 mt-1">{detailsPlan.durationWeeks ? 'Weeks' : 'Duration'}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-center">
                  <p className="text-2xl font-black text-brand-blue">{detailsPlan.extensionRules?.maxAllowedMissed ?? '—'}</p>
                  <p className="text-[10px] font-black uppercase text-ink/40 mt-1">Rescues</p>
                </div>
              </div>

              {/* Time Slots */}
              {detailsPlan.timeSlots?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase text-ink/30 mb-3 tracking-widest">Available Slots</p>
                  <div className="flex flex-wrap gap-2">
                    {detailsPlan.timeSlots.map(slot => (
                      <span key={slot} className="px-4 py-2 rounded-xl bg-brand-blue/5 border border-brand-blue/10 text-xs font-black text-brand-blue">{slot}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Trainer Policy */}
              <div className="rounded-2xl bg-slate-50 p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shrink-0 shadow-sm">{detailsPlan.trainerAllocation === 'fixed' ? '📌' : '🎲'}</div>
                <div>
                  <p className="font-black text-ink">{detailsPlan.trainerAllocation === 'fixed' ? 'Fixed Trainer' : 'Flexible Trainer'}</p>
                  <p className="text-xs text-ink/50 mt-1 leading-relaxed">
                    {detailsPlan.trainerAllocation === 'fixed'
                      ? 'You will be assigned a dedicated personal trainer for all sessions.'
                      : 'Sessions are assigned to the best available trainer based on your schedule.'}
                  </p>
                </div>
              </div>

              {/* Extension Rights */}
              {detailsPlan.extensionRules && (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5">
                  <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-3">Extension Rights</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-lg font-black text-emerald-700">{detailsPlan.extensionRules.maxAllowedMissed}</p>
                      <p className="text-[10px] font-bold text-emerald-600/70">Missed sessions can be rescheduled</p>
                    </div>
                    <div>
                      <p className="text-lg font-black text-emerald-700">{detailsPlan.extensionRules.expiryBufferDays} days</p>
                      <p className="text-[10px] font-bold text-emerald-600/70">Extension buffer after plan expires</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Benefits */}
              {detailsPlan.benefits?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase text-ink/30 mb-3 tracking-widest">What's Included</p>
                  <div className="space-y-2">
                    {detailsPlan.benefits.map((b, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm font-bold text-ink/70">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />{b}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-50">
              <button
                onClick={() => { setDetailsPlan(null); openCheckout(detailsPlan); }}
                className="w-full rounded-2xl bg-brand-blue py-4 text-base font-black text-white shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
              >
                🔒 Securely Book Now
              </button>
            </div>
          </div>
        </div>
      )}

      {showCheckout && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl animate-scale-up rounded-[2.5rem] bg-white overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-brand-blue p-8 text-white relative shrink-0">
                <button 
                  type="button"
                  onClick={closeCheckout}
                  className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all border border-white/10"
                >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
               </button>
               <div className="relative z-10 text-left">
                 <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Completing Membership</p>
                 <h3 className="font-display text-3xl font-black text-white">{selectedPlan.name}</h3>
                 <p className="mt-2 text-sm font-medium text-white/80">
                   Total to Pay: <span className="font-black text-white">{selectedPlan.price.toLocaleString()} AED</span>
                 </p>
               </div>
               <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
              
              {error && (
                <div className="rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-700 border border-rose-100 flex items-center gap-2 animate-rise text-left">
                  <span>⚠️</span> {error}
                </div>
              )}
              
              {message && (
                <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-700 border border-emerald-100 flex items-center gap-2 animate-rise text-left">
                  <span>✅</span> {message}
                </div>
              )}

              {/* Step 1 & 2 & 3: Scheduling */}
              <div className="space-y-6">
                <div className="text-left">
                  <label className="text-[10px] font-black uppercase tracking-widest text-ink/30 ml-2 mb-2 block">1. Select Child</label>
                  <select
                    value={selectedChildId}
                    onChange={(e) => setSelectedChildId(e.target.value)}
                    className="w-full rounded-2xl border-none bg-slate-50 p-4 text-sm font-bold text-ink focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all"
                    required
                  >
                    <option value="">Choose a child...</option>
                    {children.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="text-left">
                   <label className="text-[10px] font-black uppercase tracking-widest text-ink/30 ml-2 mb-2 block">2. Select Training Days</label>
                   <div className="grid grid-cols-4 gap-2 bg-slate-50 p-4 rounded-3xl">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                      const isWeekend = day === 'Sat' || day === 'Sun';
                      const isDisabled = (selectedPlan.validDays === 'weekday' && isWeekend) || (selectedPlan.validDays === 'weekend' && !isWeekend);
                      const isSelected = preferredDays.includes(day);
                      
                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setPreferredDays(prev => isSelected ? prev.filter(d => d !== day) : [...prev, day])}
                          className={`rounded-xl py-2.5 text-xs font-black transition-all ${
                            isDisabled ? 'opacity-20 cursor-not-allowed grayscale' :
                            isSelected ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'bg-white text-ink/40 hover:text-ink/60 shadow-sm border border-slate-100'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="text-left">
                  <label className="text-[10px] font-black uppercase tracking-widest text-ink/30 ml-2 mb-2 block">3. Preferred Time Slots</label>
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-4 rounded-3xl">
                    {selectedPlan.timeSlots?.length > 0 ? (
                      selectedPlan.timeSlots.map(slot => {
                        const isSelected = preferredSlots.includes(slot);
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setPreferredSlots(prev => isSelected ? prev.filter(s => s !== slot) : [...prev, slot])}
                            className={`rounded-xl py-2.5 text-[10px] font-black transition-all ${
                              isSelected ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'bg-white text-ink/40 hover:text-ink/60 shadow-sm border border-slate-100'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })
                    ) : (
                      <p className="col-span-3 text-center text-[10px] font-bold text-ink/20 py-4 italic uppercase">No predefined slots for this plan</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 4: Payment */}
              <div className="pt-8 border-t border-slate-100 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-ink/30 ml-2 mb-6 block">4. Secure Payment Details</label>
                
                <form onSubmit={handleCheckout} className="space-y-4">
                  <div className="space-y-4">
                    <input
                      type="text"
                      name="name"
                      value={cardForm.name}
                      onChange={handleCardChange}
                      className="w-full rounded-2xl border-none bg-slate-50 p-4 text-sm font-bold text-ink focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all placeholder:text-ink/20"
                      placeholder="Name on Card"
                      required
                    />
                    <input
                      type="text"
                      name="number"
                      value={cardForm.number}
                      onChange={handleCardChange}
                      maxLength="19"
                      className="w-full rounded-2xl border-none bg-slate-50 p-4 text-sm font-bold text-ink focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all placeholder:text-ink/20 font-mono"
                      placeholder="Card Number (0000 0000 0000 0000)"
                      required
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="expiry"
                        value={cardForm.expiry}
                        onChange={handleCardChange}
                        maxLength="5"
                        className="w-full rounded-2xl border-none bg-slate-50 p-4 text-sm font-bold text-ink focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all placeholder:text-ink/20"
                        placeholder="MM/YY"
                        required
                      />
                      <input
                        type="password"
                        name="cvc"
                        value={cardForm.cvc}
                        onChange={handleCardChange}
                        maxLength="4"
                        className="w-full rounded-2xl border-none bg-slate-50 p-4 text-sm font-bold text-ink focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all placeholder:text-ink/20"
                        placeholder="CVC"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      type="submit"
                      disabled={loading || message || !selectedChildId || preferredDays.length === 0 || preferredSlots.length === 0}
                      className="w-full rounded-2xl bg-brand-blue py-5 text-sm font-black text-white shadow-xl shadow-brand-blue/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
                    >
                      {message ? 'Processing Order...' : `Finalize & Pay ${selectedPlan.price.toLocaleString()} AED`}
                    </button>
                    <p className="mt-4 text-center text-[10px] font-bold text-ink/20 uppercase tracking-widest flex items-center justify-center gap-2">
                       <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"/></svg>
                       Secure 256-bit SSL Encrypted Payment
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
