import { useMemo, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import SectionTitle from '../components/SectionTitle.jsx';
import LocationPicker from '../components/LocationPicker.jsx';
import { getSelectedLocation, getLocationId } from '../utils/location.js';
import api from '../api/api.js';
import toast from 'react-hot-toast';

export default function Contact() {
  const location = useMemo(() => getSelectedLocation(), []);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/leads', {
        ...form,
        locationId: getLocationId()
      });
      toast.success('Message sent! We will contact you soon.');
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <form className="grid gap-4 rounded-3xl bg-white/80 p-6 shadow-glow" onSubmit={handleSubmit}>
            <input 
              className="rounded-xl border border-orange-200/70 p-3" 
              placeholder="Parent name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input 
              className="rounded-xl border border-orange-200/70 p-3" 
              placeholder="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <input 
              className="rounded-xl border border-orange-200/70 p-3" 
              placeholder="Phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />
            <textarea
              className="min-h-[120px] rounded-xl border border-orange-200/70 p-3"
              placeholder="Tell us about your child"
              name="message"
              value={form.message}
              onChange={handleChange}
              required
            />
            <button 
              type="submit" 
              disabled={loading}
              className={`rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-105 active:scale-95 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Sending...' : 'Send message'}
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
