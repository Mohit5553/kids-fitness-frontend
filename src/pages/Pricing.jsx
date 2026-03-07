import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import SectionTitle from '../components/SectionTitle.jsx';
import LocationPicker from '../components/LocationPicker.jsx';

const classOptions = [
  { label: '1 Class', price: '150 AED', tagline: 'Drop-in flexibility' },
  { label: '1 Active Play', price: '80 AED', tagline: 'Quick energy burst' },
  { label: '5 Classes', price: '690 AED', tagline: 'Family favorite' },
  { label: '12 Classes', price: '1,290 AED', meta: 'Valid for 8 weeks', bonus: 'Get FREE: 3 classes or 3 gym accesses in 51 Gym' },
  {
    label: '24 Classes',
    price: '2,290 AED',
    meta: 'Valid for 10 weeks',
    bonus: 'Get FREE: 3 reformer classes, 3 gym accesses, 3 shape classes in 51 Gym',
    featured: true
  }
];

const termPricing = [
  { label: '1x per week', price: '1,610 AED' },
  { label: '2x per week', price: '2,740 AED' },
  { label: '3x per week', price: '3,390 AED' }
];

export default function Pricing() {
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
              <p className="mt-2 text-xl font-semibold">From 80 AED</p>
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
            {classOptions.map((item) => (
              <div
                key={item.label}
                className={`relative overflow-hidden rounded-3xl border ${
                  item.featured ? 'border-coral/40 bg-white shadow-glow' : 'border-white/60 bg-white/80'
                } p-6`}
              >
                {item.featured ? (
                  <span className="absolute right-6 top-6 rounded-full bg-coral/15 px-3 py-1 text-xs font-semibold text-coral">
                    Best value
                  </span>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-ink/50">{item.tagline || 'Class pack'}</p>
                    <h3 className="mt-2 font-display text-xl text-ink">{item.label}</h3>
                    {item.meta ? <p className="mt-1 text-xs text-ink/60">{item.meta}</p> : null}
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Price</p>
                    <p className="mt-2 text-lg font-semibold text-ocean">{item.price}</p>
                  </div>
                </div>
                {item.bonus ? (
                  <div className="mt-4 rounded-2xl bg-ocean/5 p-3 text-xs text-ink/70">
                    {item.bonus}
                  </div>
                ) : null}
              </div>
            ))}
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
              {termPricing.map((term) => (
                <div key={term.label} className="rounded-2xl border border-orange-200/60 bg-white/80 p-5">
                  <p className="text-sm text-ink/70">{term.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-ocean">{term.price}</p>
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
