import { useEffect, useState } from 'react';
import api from '../api/api.js';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import SectionTitle from '../components/SectionTitle.jsx';
import LocationPicker from '../components/LocationPicker.jsx';

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

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
                <div key={term._id} className="rounded-2xl border border-orange-200/60 bg-white/80 p-5">
                  <p className="text-sm text-ink/70">{term.name}</p>
                  <p className="mt-2 text-2xl font-semibold text-ocean">{term.price.toLocaleString()} AED</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
