import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';
import LocationPicker from '../../components/LocationPicker.jsx';

export default function Membership() {
  const [memberships, setMemberships] = useState([]);
  const [plans, setPlans] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [cardForm, setCardForm] = useState({ name: '', number: '', expiry: '', cvc: '' });

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
            </div>
          ))}
        </div>

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

