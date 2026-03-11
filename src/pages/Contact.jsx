import { useMemo } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import SectionTitle from '../components/SectionTitle.jsx';
import LocationPicker from '../components/LocationPicker.jsx';
import { getSelectedLocation } from '../utils/location.js';

export default function Contact() {
  const location = useMemo(() => getSelectedLocation(), []);

  return (
    <div>
      <Navbar />
      <main className="page-shell py-12">
        <SectionTitle
          kicker="Contact"
          title="Let us plan their first class"
          subtitle="Share your details and we will schedule a tour within 24 hours."
        />
        <div className="mb-6">
          <LocationPicker compact />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <form className="grid gap-4 rounded-3xl bg-white/80 p-6 shadow-glow">
            <input className="rounded-xl border border-orange-200/70 p-3" placeholder="Parent name" />
            <input className="rounded-xl border border-orange-200/70 p-3" placeholder="Email" />
            <input className="rounded-xl border border-orange-200/70 p-3" placeholder="Phone" />
            <textarea
              className="min-h-[120px] rounded-xl border border-orange-200/70 p-3"
              placeholder="Tell us about your child"
            />
            <button type="button" className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white">
              Send message
            </button>
          </form>

          <div className="rounded-3xl bg-white/80 p-6 shadow-glow">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">Selected studio</p>
            <h3 className="mt-3 font-display text-xl">{location?.name || 'Choose a location'}</h3>
            <p className="mt-2 text-sm text-ink/70">{location?.address || location?.city || 'Location details update here.'}</p>
            {location?.phone ? <p className="mt-2 text-sm text-ink/70">{location.phone}</p> : null}
            {location?.email ? <p className="text-sm text-ink/70">{location.email}</p> : null}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
