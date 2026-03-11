import { useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import SectionTitle from '../components/SectionTitle.jsx';
import LocationPicker from '../components/LocationPicker.jsx';
import api from '../api/api.js';

const initialForm = {
  childName: '',
  childAge: '',
  preferredClass: '',
  preferredTime: '',
  parentName: '',
  parentEmail: '',
  parentPhone: ''
};

export default function BookTrial() {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await api.post('/trials', {
        ...form,
        childAge: form.childAge ? Number(form.childAge) : undefined
      });
      const smsStatus = res.data?.smsSent ? 'SMS sent.' : 'SMS not sent yet.';
      setMessage(`Trial request submitted. ${smsStatus}`);
      setForm(initialForm);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to submit. Please try again.');
    }
  };

  return (
    <div>
      <Navbar />
      <main className="page-shell py-12">
        <SectionTitle
          kicker="Book trial"
          title="Reserve a complimentary session"
          subtitle="Pick a class and we will confirm your slot by SMS."
        />
        <div className="mb-6">
          <LocationPicker compact />
        </div>
        {message ? <p className="mb-3 text-sm text-moss">{message}</p> : null}
        {error ? <p className="mb-3 text-sm text-coral">{error}</p> : null}
        <form className="grid gap-4 rounded-3xl bg-white/80 p-6 shadow-glow" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="rounded-xl border border-orange-200/70 p-3"
              name="childName"
              placeholder="Child name"
              value={form.childName}
              onChange={handleChange}
              required
            />
            <input
              className="rounded-xl border border-orange-200/70 p-3"
              name="childAge"
              type="number"
              placeholder="Age"
              value={form.childAge}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="rounded-xl border border-orange-200/70 p-3"
              name="preferredClass"
              placeholder="Preferred class"
              value={form.preferredClass}
              onChange={handleChange}
            />
            <input
              className="rounded-xl border border-orange-200/70 p-3"
              name="preferredTime"
              placeholder="Preferred time"
              value={form.preferredTime}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="rounded-xl border border-orange-200/70 p-3"
              name="parentName"
              placeholder="Parent name"
              value={form.parentName}
              onChange={handleChange}
              required
            />
            <input
              className="rounded-xl border border-orange-200/70 p-3"
              name="parentPhone"
              placeholder="Parent phone"
              value={form.parentPhone}
              onChange={handleChange}
            />
          </div>
          <input
            className="rounded-xl border border-orange-200/70 p-3"
            name="parentEmail"
            type="email"
            placeholder="Parent email"
            value={form.parentEmail}
            onChange={handleChange}
            required
          />
          <button type="submit" className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white">
            Book trial
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
