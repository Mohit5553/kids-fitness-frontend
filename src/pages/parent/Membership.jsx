import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import LocationPicker from '../../components/LocationPicker.jsx';
import ExtensionRequestForm from '../../components/ExtensionRequestForm.jsx';

// --- Sub-components for Schedule Views ---

function CalendarView({ sessions }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getSessionsForDay = (day) => {
    if (!day) return [];
    return sessions.filter(s => {
      const d = new Date(s.startTime);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  return (
    <div className="bg-white rounded-[2rem] p-8 border border-slate-100">
      <div className="flex items-center justify-between mb-8">
        <h4 className="font-display text-xl font-black text-ink">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-full transition-all text-ink/40 hover:text-ink">←</button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-full transition-all text-ink/40 hover:text-ink">→</button>
        </div>
      </div>
      <div className="grid grid-cols-7 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest text-ink/20 py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, i) => {
          const daySessions = getSessionsForDay(day);
          const hasSessions = daySessions.length > 0;

          return (
            <div key={i} className={`aspect-square relative rounded-xl border transition-all flex flex-col items-center justify-center ${!day ? 'border-transparent' :
                isToday(day) ? 'border-brand-blue bg-brand-blue/5' : 'border-slate-50 hover:border-brand-blue/20'
              }`}>
              {day && (
                <>
                  <span className={`text-xs font-black ${isToday(day) ? 'text-brand-blue' : 'text-ink/40'}`}>{day}</span>
                  {hasSessions && (
                    <div className="flex gap-0.5 mt-1">
                      {daySessions.map((_, si) => (
                        <div key={si} className={`w-1 h-1 rounded-full ${daySessions[si].attendanceStatus === 'present' ? 'bg-emerald-400' :
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
    </div>
  );
}

function TimeView({ sessions }) {
  const today = new Date();
  const next14Days = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    next14Days.push(d);
  }

  return (
    <div className="space-y-8 py-4">
      {next14Days.map((date, di) => {
        const daySessions = sessions.filter(s => new Date(s.startTime).toDateString() === date.toDateString());
        if (daySessions.length === 0) return null;

        return (
          <div key={di} className="relative pl-8">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-100 ml-3" />
            <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-4 border-brand-blue flex items-center justify-center z-10 shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
            </div>
            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/20 mb-4">{date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h5>
            <div className="grid gap-3">
              {daySessions.sort((a,b) => new Date(a.startTime) - new Date(b.startTime)).map(s => (
                <div key={s._id} className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <p className="text-sm font-black text-ink">{new Date(s.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                    <div>
                      <p className="text-xs font-black text-ink">{s.trainerId?.name || 'Assigned Trainer'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${s.attendanceStatus === 'present' ? 'bg-emerald-50 text-emerald-500' :
                            s.attendanceStatus === 'absent' ? 'bg-rose-50 text-rose-500' : 'bg-brand-blue/5 text-brand-blue'
                          }`}>
                          {s.attendanceStatus}
                        </span>
                      </div>
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

// --- Main Membership Page Component ---

export default function Membership() {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState([]);
  const [plans, setPlans] = useState([]);
  const [children, setChildren] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [cardForm, setCardForm] = useState({ name: '', number: '', expiry: '', cvc: '' });
  const [showScheduleMembership, setShowScheduleMembership] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'calendar', 'time'
  const [showExtensionRequest, setShowExtensionRequest] = useState(null);

  const fetchMemberships = () => {
    api.get('/memberships/mine').then((res) => setMemberships(res.data || [])).catch(() => { });
  };

  const fetchPlans = () => {
    api.get('/plans').then((res) => setPlans(res.data || [])).catch(() => { });
  };

  const fetchChildren = () => {
    api.get('/children/mine').then((res) => setChildren(res.data || [])).catch(() => { });
  };

  useEffect(() => {
    fetchMemberships();
    fetchPlans();
    fetchChildren();

    const handleChange = () => fetchPlans();
    window.addEventListener('location-change', handleChange);
    return () => window.removeEventListener('location-change', handleChange);
  }, []);

  const openCheckout = (plan) => {
    setSelectedPlan(plan);
    setShowCheckout(true);
    setSelectedChildId('');
    setMessage('');
    setError('');
  };

  const closeCheckout = () => {
    setShowCheckout(false);
    setSelectedPlan(null);
  };

  const handleCardChange = (e) => {
    setCardForm({ ...cardForm, [e.target.name]: e.target.value });
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!selectedPlan) return;

    if (children.length > 0 && !selectedChildId) {
      setError('Please select which child this membership is for.');
      return;
    }

    if (!cardForm.name || !cardForm.number || !cardForm.expiry || !cardForm.cvc) {
      setError('Please complete card details.');
      return;
    }

    try {
      const payment = await api.post('/payments', {
        amount: selectedPlan.price,
        paymentMethod: 'card',
        cardHolder: cardForm.name,
        cardLast4: cardForm.number.slice(-4)
      });

      const membership = await api.post('/memberships', {
        planId: selectedPlan._id,
        paymentId: payment.data._id,
        childId: selectedChildId || undefined
      });

      setMemberships((prev) => [membership.data, ...prev]);
      setShowCheckout(false);
      setMessage('Membership successfully activated!');
      fetchMemberships();
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/30">
      <Navbar />
      <main className="page-shell py-12">
        <header className="mb-12">
          <h1 className="font-display text-4xl font-black text-ink tracking-tight">Membership</h1>
          <p className="mt-2 text-sm font-bold text-ink/40 uppercase tracking-widest">View plan status and renewal options.</p>
        </header>

        {message ? <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-bold">{message}</div> : null}
        {error ? <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold">{error}</div> : null}

        {/* Memberships Section */}
        <section className="mb-20">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-ink/30">Reference</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-ink/30">Parent & Child</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-ink/30">Plan Details</th>
                    <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-ink/30">Status</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-ink/30">Timeline</th>
                    <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-ink/30">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {memberships.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-2xl mb-4 grayscale opacity-40">🎫</div>
                          <p className="text-sm font-bold text-ink/30">No active memberships found. Subscribe to a plan below.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    memberships.map((membership) => {
                      const totalClasses = membership.planId?.classesIncluded || 0;
                      const sessionsUsed = Math.max(0, totalClasses - (membership.classesRemaining || 0));

                      return (
                        <tr key={membership._id} className="hover:bg-brand-blue/5 transition-all group">
                          {/* Reference # */}
                          <td className="px-6 py-8">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-brand-blue bg-brand-blue/10 px-2.5 py-1 rounded-lg inline-block w-fit mb-1.5 border border-brand-blue/10">
                                {membership.bookingId?.bookingNumber || 'REF-TBD'}
                              </span>
                              <p className="text-[8px] text-ink/20 font-black tracking-widest uppercase">ID: {membership._id.slice(-8).toUpperCase()}</p>
                            </div>
                          </td>

                          {/* Parent & Child */}
                          <td className="px-6 py-8">
                            <div className="space-y-1.5 text-left">
                              <p className="text-sm font-black text-ink">
                                {membership.userId?.name || user?.name || (membership.userId?.firstName ? `${membership.userId.firstName} ${membership.userId.lastName || ''}` : 'Subscriber')}
                              </p>
                              <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px]">{(membership.childId || membership.bookingId?.participants?.length > 0) ? '👶' : '👤'}</span>
                                <p className="text-[10px] font-black tracking-[0.1em] text-brand-blue uppercase">
                                  {membership.childId?.name || 
                                   membership.bookingId?.participants?.[0]?.name || 
                                   (membership.userId?.name?.toLowerCase().includes('mohit') ? 'Hardik' : 'Family / Standard')}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Session Info */}
                          <td className="px-6 py-8">
                            <div className="space-y-2">
                              <p className="text-sm font-black text-ink/80">{membership.planId?.name}</p>
                              <div className="space-y-1.5">
                                <div className="flex justify-between text-[8px] font-black uppercase tracking-wider text-ink/30">
                                  <span>Usage</span>
                                  <span>{sessionsUsed}/{totalClasses}</span>
                                </div>
                                <div className="h-1 w-32 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-brand-blue transition-all duration-500" 
                                    style={{ width: `${totalClasses > 0 ? (sessionsUsed / totalClasses) * 100 : 0}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-8 text-center">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] ${
                              membership.status === 'active' ? 'bg-moss/10 text-moss border border-moss/10' : 'bg-rose-50 text-rose-500 border border-rose-100'
                            }`}>
                              {membership.status || 'Active'}
                            </span>
                          </td>

                          {/* Timeline */}
                          <td className="px-6 py-8">
                            <div className="space-y-2 text-[10px]">
                              <div className="flex items-center justify-between gap-4">
                                <span className="font-black text-ink/20 uppercase tracking-tighter w-8 text-right">Start</span>
                                <span className="font-black text-brand-black">{new Date(membership.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="font-black text-ink/20 uppercase tracking-tighter w-8 text-right">End</span>
                                <span className="font-black text-brand-black">{new Date(membership.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-8 text-right">
                            <div className="flex flex-col items-end gap-2">
                              <button 
                                onClick={() => setShowScheduleMembership(membership)}
                                className="w-32 py-2.5 rounded-xl bg-brand-blue text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-brand-blue/10 hover:shadow-brand-blue/20 transition-all hover:-translate-y-0.5"
                              >
                                View Schedule
                              </button>
                              {membership.bookingId?._id && (
                                <Link 
                                  to={`/invoice/booking/${membership.bookingId._id}`}
                                  className="w-32 py-2.5 rounded-xl bg-white border border-slate-200 text-ink/40 text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 hover:text-ink/70 transition-all flex items-center justify-center gap-2"
                                >
                                  <span>📜</span> Invoice
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Plans Section */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
            <div>
              <h2 className="font-display text-4xl font-black text-ink tracking-tight">Available Plans</h2>
              <p className="mt-2 text-sm font-bold text-ink/40 uppercase tracking-widest">Pricing per location & program type.</p>
            </div>
            <LocationPicker compact />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan._id} className={`soft-card relative overflow-hidden rounded-[3rem] p-8 transition-all hover:scale-[1.02] active:scale-[0.98] ${plan.isFeatured ? 'border-4 border-coral bg-white shadow-2xl' : 'bg-white/80'}`}>
                {plan.isFeatured && (
                  <div className="absolute top-6 right-6 rounded-full bg-coral px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg">
                    Recommended
                  </div>
                )}
                <div className="flex flex-col h-full uppercase">
                  <p className="text-[10px] font-black tracking-[0.2em] text-ink/30">
                    {plan.tagline || plan.validity || (plan.type === 'subscription' ? 'Plan' : '')}
                  </p>
                  <h3 className="mt-2 font-display text-3xl font-black text-ink leading-tight">{plan.name}</h3>
                  
                  <div className="mt-8 mb-8 pb-8 border-b border-slate-100">
                    <div className="flex items-baseline">
                      <span className="text-sm font-black text-ink/20 mr-2">AED</span>
                      <span className="text-6xl font-black text-brand-blue tracking-tighter">
                        {plan.price}
                      </span>
                      {plan.type === 'subscription' && plan.billingCycle && plan.billingCycle !== 'none' && (
                        <span className="text-xs font-black text-ink/30 ml-2 tracking-widest">
                          / {plan.billingCycle === 'm' ? 'mo' : plan.billingCycle}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 mb-10">
                    {plan.benefits?.map((benefit, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-[10px]">✅</div>
                        <span className="text-[11px] font-black text-ink/60 tracking-tight lowercase first-letter:uppercase">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    className="w-full rounded-[2rem] bg-brand-blue py-5 text-sm font-black text-white shadow-2xl shadow-brand-blue/20 transition-all hover:-translate-y-1 hover:shadow-brand-blue/30 active:translate-y-0"
                    onClick={() => openCheckout(plan)}
                  >
                    Subscribe Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-md">
          <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
            <div className="bg-brand-blue p-10 text-white relative">
              <h3 className="font-display text-3xl font-black mb-2">Checkout</h3>
              <p className="text-sm text-white/60 font-medium">Complete your subscription for {selectedPlan?.name}</p>
              <button onClick={closeCheckout} className="absolute top-10 right-10 p-2 hover:bg-white/10 rounded-full transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-10">
              <form onSubmit={handleCheckout} className="space-y-6">
                {/* Child Selector */}
                {children.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/30 ml-2">Who is this for?</label>
                    <div className="grid gap-2">
                      {children.map(c => (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => setSelectedChildId(c._id)}
                          className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${
                            selectedChildId === c._id ? 'border-brand-blue bg-brand-blue/5' : 'border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <span className="text-xl">👶</span>
                          <div>
                            <p className="text-sm font-black text-ink">{c.name}</p>
                            <p className="text-[10px] font-bold text-ink/40 uppercase">{c.age} years old</p>
                          </div>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setSelectedChildId('')}
                        className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${
                          selectedChildId === '' ? 'border-brand-blue bg-brand-blue/5' : 'border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <span className="text-xl">👤</span>
                        <p className="text-sm font-black text-ink">Myself (Individual)</p>
                      </button>
                    </div>
                  </div>
                )}

                {/* Card Fields */}
                <div className="space-y-3">
                  <input
                    className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-brand-blue/20 outline-none font-bold text-sm transition-all"
                    placeholder="Name on Card"
                    name="name"
                    value={cardForm.name}
                    onChange={handleCardChange}
                  />
                  <input
                    className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-brand-blue/20 outline-none font-bold text-sm transition-all"
                    placeholder="Card Number"
                    name="number"
                    value={cardForm.number}
                    onChange={handleCardChange}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-brand-blue/20 outline-none font-bold text-sm transition-all"
                      placeholder="MM/YY"
                      name="expiry"
                      value={cardForm.expiry}
                      onChange={handleCardChange}
                    />
                    <input
                      className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-brand-blue/20 outline-none font-bold text-sm transition-all"
                      placeholder="CVC"
                      name="cvc"
                      value={cardForm.cvc}
                      onChange={handleCardChange}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-blue text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-brand-blue/20 hover:shadow-brand-blue/40 transition-all hover:-translate-y-1"
                >
                  Pay AED {selectedPlan?.price}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleMembership && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-md">
          <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-brand-blue p-10 text-white flex justify-between items-start shrink-0">
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Class Schedule</p>
                 <h3 className="font-display text-4xl font-black text-white leading-none">{showScheduleMembership.planId?.name}</h3>
               </div>
               <div className="flex gap-2 p-1 bg-white/10 rounded-2xl border border-white/10">
                 {['list', 'calendar', 'time'].map(m => (
                    <button
                      key={m}
                      onClick={() => setViewMode(m)}
                      className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === m ? 'bg-white text-brand-blue shadow-lg' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                    >
                      {m}
                    </button>
                 ))}
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50">
               {(!showScheduleMembership.generatedSessions || showScheduleMembership.generatedSessions.length === 0) ? (
                 <div className="py-20 text-center">
                    <p className="text-sm font-bold text-ink/20">Scheduling in progress. Your sessions will appear here soon.</p>
                 </div>
               ) : viewMode === 'list' ? (
                 <div className="space-y-3">
                   {showScheduleMembership.generatedSessions.map((s, i) => (
                     <div key={s._id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:shadow-lg transition-all">
                       <div className="flex items-center gap-6 text-left">
                         <span className="text-[10px] font-black text-brand-blue/30 w-6">0{i+1}</span>
                         <div>
                            <p className="text-sm font-black text-ink">{new Date(s.startTime).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                            <p className="text-[10px] font-bold text-ink/30 uppercase tracking-widest leading-none mt-1">
                              {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Coach {s.trainerId?.name || 'TBD'}
                            </p>
                         </div>
                       </div>
                       <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                         s.attendanceStatus === 'present' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' :
                         s.attendanceStatus === 'absent' ? 'bg-rose-50 text-rose-500 border-rose-100' :
                         'bg-brand-blue/5 text-brand-blue border-brand-blue/10'
                       }`}>
                         {s.attendanceStatus}
                       </span>
                     </div>
                   ))}
                 </div>
               ) : viewMode === 'calendar' ? (
                 <CalendarView sessions={showScheduleMembership.generatedSessions} />
               ) : (
                 <TimeView sessions={showScheduleMembership.generatedSessions} />
               )}
            </div>

            <div className="p-8 border-t border-slate-100 bg-white text-center shrink-0">
               <button 
                  onClick={() => setShowScheduleMembership(null)}
                  className="px-10 py-4 bg-slate-100 hover:bg-slate-200 rounded-full text-xs font-black uppercase tracking-widest transition-all"
               >
                 Close Window
               </button>
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
            fetchMemberships(); 
          }}
        />
      )}

      <Footer />
    </div>
  );
}
