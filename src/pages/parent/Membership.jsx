import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';
import LocationPicker from '../../components/LocationPicker.jsx';
import ExtensionRequestForm from '../../components/ExtensionRequestForm.jsx';

function CalendarView({ sessions }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = [];
  // Blank days
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  // Real days
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getSessionsForDay = (day) => {
    if (!day) return [];
    return sessions.filter(s => {
      const d = new Date(s.startTime);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  return (
    <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-6 px-2">
        <h4 className="font-display text-lg font-black text-ink">{monthName} {year}</h4>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-full text-ink/40 hover:text-brand-blue transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-full text-ink/40 hover:text-brand-blue transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <div key={d} className="text-[10px] font-black text-ink/20 text-center py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const daySessions = getSessionsForDay(day);
          const hasSessions = daySessions.length > 0;
          const isToday = day && new Date().toDateString() === new Date(year, month, day).toDateString();

          return (
            <div key={i} className={`aspect-square relative rounded-xl border transition-all flex flex-col items-center justify-center ${
              !day ? 'border-transparent' :
              isToday ? 'border-brand-blue bg-brand-blue/5' : 'border-slate-50 hover:border-brand-blue/20'
            }`}>
              {day && (
                <>
                  <span className={`text-[11px] font-black ${isToday ? 'text-brand-blue' : 'text-ink/60'}`}>{day}</span>
                  {hasSessions && (
                    <div className="flex gap-0.5 mt-1">
                      {daySessions.map((_, si) => (
                        <div key={si} className={`w-1 h-1 rounded-full ${
                          daySessions[si].attendanceStatus === 'present' ? 'bg-emerald-400' :
                          daySessions[si].attendanceStatus === 'absent' ? 'bg-rose-400' : 'bg-brand-blue'
                        }`} />
                      ))}
                    </div>
                  )}
                  {hasSessions && (
                    <div className="absolute inset-0 opacity-0 hover:opacity-100 bg-white/95 rounded-xl flex items-center justify-center p-1 z-10 transition-all shadow-xl border border-brand-blue/10">
                       <p className="text-[8px] font-black text-brand-blue text-center leading-tight">
                         {daySessions.map(s => new Date(s.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })).join('\n')}
                       </p>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex justify-center gap-4 border-t border-slate-50 pt-4">
         <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-brand-blue" /><span className="text-[9px] font-black text-ink/40 uppercase">Upcoming</span></div>
         <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-[9px] font-black text-ink/40 uppercase">Present</span></div>
         <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-400" /><span className="text-[9px] font-black text-ink/40 uppercase">Absent</span></div>
      </div>
    </div>
  );
}

function TimeView({ sessions }) {
  // Show a vertical timeline for the next 7 days
  const today = new Date();
  const next7Days = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    next7Days.push(d);
  }

  return (
    <div className="space-y-6">
      {next7Days.map((date, di) => {
        const daySessions = sessions.filter(s => new Date(s.startTime).toDateString() === date.toDateString());
        if (daySessions.length === 0) return null;

        return (
          <div key={di} className="relative pl-8">
            {/* Day Header */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-100 ml-3" />
            <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-4 border-brand-blue flex items-center justify-center z-10 shadow-sm">
               <div className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
            </div>
            
            <div className="mb-4">
               <h4 className="text-xs font-black text-ink uppercase tracking-widest">
                 {date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
               </h4>
            </div>

            <div className="space-y-3">
              {daySessions.map(s => (
                <div key={s._id} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                   <div className="w-16 flex flex-col items-end">
                      <span className="text-[10px] font-black text-brand-blue">{new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-[8px] font-bold text-ink/30 uppercase tracking-tighter">Starts</span>
                   </div>
                   <div className="h-8 w-px bg-slate-100" />
                   <div className="flex-1">
                      <p className="text-xs font-black text-ink">{s.trainerId?.name || 'Assigned Trainer'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                           s.attendanceStatus === 'present' ? 'bg-emerald-50 text-emerald-500' :
                           s.attendanceStatus === 'absent' ? 'bg-rose-50 text-rose-500' : 'bg-brand-blue/5 text-brand-blue'
                        }`}>
                           {s.attendanceStatus}
                        </span>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Membership() {
  const [memberships, setMemberships] = useState([]);
  const [plans, setPlans] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [cardForm, setCardForm] = useState({ name: '', number: '', expiry: '', cvc: '' });
  const [showScheduleMembership, setShowScheduleMembership] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'calendar', 'time'
  const [showExtensionRequest, setShowExtensionRequest] = useState(null); // { membershipId, sessionId, type }

  const fetchMemberships = () => {
    api.get('/memberships/mine').then((res) => setMemberships(res.data || [])).catch(() => { });
  };

  const fetchPlans = () => {
    api.get('/plans').then((res) => setPlans(res.data || [])).catch(() => { });
  };

  useEffect(() => {
    fetchMemberships();
    fetchPlans();

    const handleChange = () => fetchPlans();
    window.addEventListener('location-change', handleChange);
    return () => window.removeEventListener('location-change', handleChange);
  }, []);

  const openCheckout = (plan) => {
    setSelectedPlan(plan);
    setShowCheckout(true);
    setMessage('');
    setError('');
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

      const membership = await api.post('/memberships', {
        planId: selectedPlan._id,
        paymentId: payment.data._id
      });

      setMemberships((prev) => [membership.data, ...prev]);
      setMessage('Payment successful. Membership activated.');
      closeCheckout();
    } catch (err) {
      setError(err?.response?.data?.message || 'Payment failed. Try again.');
    }
  };

  return (
    <div>
      <Navbar />
      <main className="page-shell py-12">
        <h1 className="font-display text-3xl">Membership</h1>
        <p className="mt-2 text-sm text-ink/70">View plan status and renewal options.</p>
        {message ? <p className="mt-3 text-sm text-moss">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-coral">{error}</p> : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {memberships.map((membership) => (
            <div key={membership._id} className="rounded-2xl bg-white/80 p-4 shadow-glow">
              <p className="font-semibold">{membership.planId?.name}</p>
              <p className="text-xs text-ink/70">Status: {membership.status}</p>
              {membership.endDate ? (
                <p className="text-xs text-ink/70">Ends: {new Date(membership.endDate).toLocaleDateString()}</p>
              ) : null}
              {membership.classesRemaining != null ? (
                <p className="text-xs text-ink/70">Classes remaining: {membership.classesRemaining}</p>
              ) : null}
              {membership.status === 'active' && (
                <div className="mt-4 pt-4 border-t border-slate-100/50 flex flex-wrap gap-2">
                   <button
                     onClick={() => setShowScheduleMembership(membership)}
                     className="rounded-xl bg-brand-blue/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-brand-blue hover:bg-brand-blue/10 transition-all font-black"
                   >
                     View My Schedule
                   </button>
                   <button
                     onClick={() => setShowExtensionRequest({ membershipId: membership._id, type: 'extend' })}
                     className="rounded-xl bg-orange-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-orange-600 hover:bg-orange-100 transition-all border border-orange-100/50 font-black"
                   >
                     Extend Duration
                   </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Schedule Modal */}
        {showScheduleMembership && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-2xl max-h-[85vh] bg-white rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col">
               <div className="bg-brand-blue p-8 text-white flex shrink-0 justify-between items-start">
                   <div className="relative z-10 flex flex-col gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Membership Schedule</p>
                      <h3 className="font-display text-2xl font-black text-white">{showScheduleMembership.planId?.name}</h3>
                    </div>
                    {/* View Toggle */}
                    <div className="flex bg-white/10 rounded-xl p-1 gap-1 w-fit">
                      {['list', 'calendar', 'time'].map(mode => (
                        <button
                          key={mode}
                          onClick={() => setViewMode(mode)}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                            viewMode === mode ? 'bg-white text-brand-blue shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => setShowScheduleMembership(null)} className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition-all ml-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                  <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
               </div>
               
               <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-slate-50/50">
                   {(!showScheduleMembership.generatedSessions || showScheduleMembership.generatedSessions.length === 0) ? (
                      <div className="py-20 flex flex-col items-center justify-center text-center px-10">
                        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-3xl mb-6 grayscale opacity-50">🗓️</div>
                        <h4 className="text-lg font-black text-ink mb-2">Schedule Not Generated</h4>
                        <p className="text-xs font-bold text-ink/40 leading-relaxed max-w-xs">
                          Your training schedule is being prepared. It will appear here shortly once your coach assigns your sessions.
                        </p>
                      </div>
                   ) : viewMode === 'list' ? (
                     showScheduleMembership.generatedSessions.map((s, i) => (
                      <div key={s._id} className="rounded-3xl bg-white p-5 border border-slate-100 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all">
                         <div className="flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-xs ${
                              s.attendanceStatus === 'present' ? 'bg-emerald-100 text-emerald-600' :
                              s.attendanceStatus === 'absent' ? 'bg-rose-100 text-rose-600' : 'bg-brand-blue/10 text-brand-blue'
                            }`}>
                              {i + 1}
                            </div>
                            <div>
                              <p className="text-sm font-black text-ink">{new Date(s.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                              <p className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">{new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {s.trainerId?.name || 'Assigned Trainer'}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              s.attendanceStatus === 'present' ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' :
                              s.attendanceStatus === 'absent' ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-sky-50 text-sky-500 border border-sky-100'
                            }`}>
                               {s.attendanceStatus}
                            </span>
                            {s.attendanceStatus === 'absent' && (
                              <button
                                 onClick={() => setShowExtensionRequest({ membershipId: showScheduleMembership._id, sessionId: s._id, type: 'reschedule' })}
                                 className="px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-[9px] font-black uppercase tracking-widest hover:bg-orange-200 transition-all"
                              >
                                 Reschedule
                              </button>
                            )}
                         </div>
                      </div>
                    ))
                   ) : viewMode === 'calendar' ? (
                      <CalendarView sessions={showScheduleMembership.generatedSessions} />
                   ) : (
                      <TimeView sessions={showScheduleMembership.generatedSessions} />
                   )}
               </div>
               <div className="p-8 border-t border-slate-100 bg-white text-center shrink-0">
                  <p className="text-xs font-bold text-ink/30 italic">Sessions are automatically generated based on your preference during purchase.</p>
               </div>
            </div>
          </div>
        )}

        {/* Extension/Reschedule Form Modal */}
        {showExtensionRequest && (
          <ExtensionRequestForm
            {...showExtensionRequest}
            onClose={() => setShowExtensionRequest(null)}
            onSuccess={() => {
               fetchMemberships(); // Refresh data to show pending status or updated schedule
            }}
          />
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-2xl">Subscribe to a plan</h2>
          <LocationPicker compact />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan._id} className={`soft-card relative overflow-hidden rounded-3xl p-6 transition-all hover:scale-[1.01] ${plan.isFeatured ? 'border-2 border-coral bg-white shadow-glow' : ''}`}>
              {plan.isFeatured && (
                <div className="absolute top-4 right-4 rounded-full bg-coral px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  Best Value
                </div>
              )}
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/50">
                    {plan.tagline || plan.validity || (plan.type === 'subscription' ? 'Subscription' : '')}
                  </p>
                  <h3 className="mt-1 font-display text-xl">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-ocean">
                      AED {plan.price}
                      {plan.type === 'subscription' && plan.billingCycle && plan.billingCycle !== 'none' && (
                        <span className="text-sm font-normal text-ink/60 ml-1">
                          / {plan.billingCycle === 'weekly' ? 'wk' : plan.billingCycle === 'monthly' ? 'mo' : 'yr'}
                        </span>
                      )}
                    </span>
                  </div>
                  {plan.benefits && plan.benefits.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {plan.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-ink/70">
                          <svg className="h-3 w-3 text-moss" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  className="mt-6 w-full rounded-full bg-coral py-3 text-sm font-bold text-white shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  onClick={() => openCheckout(plan)}
                >
                  Subscribe Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
      {showCheckout ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="relative w-full max-w-md animate-scale-up rounded-[32px] bg-white overflow-hidden shadow-2xl">
            <div className="bg-brand-blue p-8 text-white relative overflow-hidden">
               <div className="relative z-10">
                 <h3 className="font-display text-3xl font-black text-white">Secure checkout</h3>
                 <p className="mt-1 text-sm text-white/80 font-medium italic">
                   Test mode only. No real charge will be made.
                 </p>
               </div>
               {/* Decorative circle */}
               <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            </div>
            
            <div className="p-8">
            <form className="mt-4 grid gap-3" onSubmit={handleCheckout}>
              <input
                className="w-full rounded-2xl border-none bg-slate-50 p-4 text-sm font-bold text-ink focus:ring-4 focus:ring-brand-blue/5 focus:bg-white outline-none transition-all placeholder:text-ink/20"
                name="name"
                placeholder="Name on card"
                value={cardForm.name}
                onChange={handleCardChange}
              />
              <input
                className="w-full rounded-2xl border-none bg-slate-50 p-4 text-sm font-bold text-ink focus:ring-4 focus:ring-brand-blue/5 focus:bg-white outline-none transition-all placeholder:text-ink/20"
                name="number"
                placeholder="0000 0000 0000 0000"
                value={cardForm.number}
                onChange={handleCardChange}
              />
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="w-full rounded-2xl border-none bg-slate-50 p-4 text-sm font-bold text-ink focus:ring-4 focus:ring-brand-blue/5 focus:bg-white outline-none transition-all placeholder:text-ink/20"
                  name="expiry"
                  placeholder="MM/YY"
                  value={cardForm.expiry}
                  onChange={handleCardChange}
                />
                <input
                  className="w-full rounded-2xl border-none bg-slate-50 p-4 text-sm font-bold text-ink focus:ring-4 focus:ring-brand-blue/5 focus:bg-white outline-none transition-all placeholder:text-ink/20"
                  type="password"
                  name="cvc"
                  placeholder="CVC"
                  value={cardForm.cvc}
                  onChange={handleCardChange}
                />
              </div>
              <div className="mt-6 flex flex-col gap-3">
                <button
                  className="w-full rounded-2xl bg-brand-blue py-5 text-sm font-black text-white shadow-xl shadow-brand-blue/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  type="submit"
                >
                  Pay AED {selectedPlan?.price}
                </button>
                <button
                  type="button"
                  className="w-full rounded-2xl border-2 border-slate-100 py-4 text-[10px] font-black uppercase tracking-widest text-ink/30 transition-all hover:bg-slate-50 hover:text-ink/50"
                  onClick={closeCheckout}
                >
                  Cancel Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      ) : null}
      <Footer />
    </div>
  );
}

