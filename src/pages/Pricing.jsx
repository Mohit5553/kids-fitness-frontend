import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api.js';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import SectionTitle from '../components/SectionTitle.jsx';
import LocationPicker from '../components/LocationPicker.jsx';
import { getUser } from '../utils/auth.js';

export default function Pricing() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Checkout State
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [cardForm, setCardForm] = useState({ name: '', number: '', expiry: '', cvc: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchPlans = async () => {
    try {
      const res = await api.get('/plans');
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
  };

  const closeCheckout = () => {
    setShowCheckout(false);
    setSelectedPlan(null);
    setCardForm({ name: '', number: '', expiry: '', cvc: '' });
  };

  const handleCardChange = (event) => {
    setCardForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
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

      await api.post('/memberships', {
        planId: selectedPlan._id,
        paymentId: payment.data._id
      });

      setMessage('Payment successful! Your membership is active.');
      setTimeout(() => {
        closeCheckout();
        navigate('/dashboard'); // Navigate to parent dashboard to see membership
      }, 2000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Payment failed. Try again.');
    }
  };

  const classOptions = plans.filter(p => p.type === 'pack');
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
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs uppercase tracking-[0.2em] text-ink/50">{item.tagline || item.validity || 'Class pack'}</p>
                        {item.locationId?.name ? (
                          <span className="rounded-full bg-ocean/10 px-2 py-0.5 text-[10px] font-bold text-ocean/80">
                            {item.locationId.name}
                          </span>
                        ) : (
                          <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-bold text-ink/40">
                            All locations
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2 font-display text-xl text-ink">{item.name}</h3>
                      {item.durationWeeks ? <p className="mt-1 text-xs text-ink/60">Valid for {item.durationWeeks} weeks</p> : null}
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Price</p>
                      <p className="mt-2 text-lg font-semibold text-ocean">{item.price.toLocaleString()} AED</p>
                    </div>
                  </div>
                  {item.benefits && item.benefits.length > 0 ? (
                    <div className="mt-4 rounded-2xl bg-ocean/5 p-3 text-xs text-ink/70">
                      {item.benefits.join(' · ')}
                    </div>
                  ) : null}
                  <div className="mt-5">
                    <button 
                      onClick={() => openCheckout(item)} 
                      className="w-full rounded-2xl bg-brand-blue py-3.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
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

      {/* Checkout Modal */}
      {showCheckout && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={closeCheckout} />
          <div className="relative w-full max-w-md animate-scale-up rounded-[32px] bg-white p-6 shadow-2xl sm:p-8">
            <button
              onClick={closeCheckout}
              className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-ink/60 transition-colors hover:bg-slate-200 hover:text-ink"
            >
              ×
            </button>
            <h3 className="font-display text-2xl text-ink">Complete Purchase</h3>
            <p className="mt-2 text-sm text-ink/60">
              You are selecting the <strong>{selectedPlan.name}</strong> package for {selectedPlan.price.toLocaleString()} AED.
            </p>

            {error && (
              <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600 border border-red-100">
                {error}
              </div>
            )}
            
            {message && (
              <div className="mt-6 rounded-2xl bg-green-50 p-4 text-sm font-medium text-green-700 border border-green-100">
                {message}
              </div>
            )}

            <form onSubmit={handleCheckout} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-ink/40">Cardholder Name</label>
                <input
                  type="text"
                  name="name"
                  value={cardForm.name}
                  onChange={handleCardChange}
                  className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-brand-blue focus:bg-white"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-ink/40">Card Number</label>
                <input
                  type="text"
                  name="number"
                  value={cardForm.number}
                  onChange={handleCardChange}
                  maxLength="19"
                  className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-brand-blue focus:bg-white"
                  placeholder="0000 0000 0000 0000"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-ink/40">Expiry</label>
                  <input
                    type="text"
                    name="expiry"
                    value={cardForm.expiry}
                    onChange={handleCardChange}
                    maxLength="5"
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-brand-blue focus:bg-white"
                    placeholder="MM/YY"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-ink/40">CVC</label>
                  <input
                    type="password"
                    name="cvc"
                    value={cardForm.cvc}
                    onChange={handleCardChange}
                    maxLength="4"
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-brand-blue focus:bg-white"
                    placeholder="123"
                    required
                  />
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={loading || message}
                  className="w-full rounded-full bg-brand-blue py-4 font-bold text-white transition-transform active:scale-95 disabled:opacity-50"
                >
                  {message ? 'Processing...' : `Pay ${selectedPlan.price.toLocaleString()} AED`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
