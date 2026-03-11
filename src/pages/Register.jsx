import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import api from '../api/api.js';
import { getUser, setAuth } from '../utils/auth.js';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  useEffect(() => {
    const user = getUser();
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/register', form);
      setAuth(res.data);
      navigate(res.data.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed. Try another email.');
    }
  };

  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-3xl bg-white/80 p-6 shadow-glow">
          <h1 className="font-display text-3xl">Create account</h1>
          <p className="mt-2 text-sm text-ink/70">Start booking classes in minutes.</p>
          {error ? <p className="mt-3 text-sm text-coral">{error}</p> : null}
          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <input
              className="rounded-xl border border-orange-200/70 p-3"
              name="name"
              placeholder="Full name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              className="rounded-xl border border-orange-200/70 p-3"
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <input
              className="rounded-xl border border-orange-200/70 p-3"
              name="phone"
              placeholder="Phone"
              value={form.phone}
              onChange={handleChange}
            />
            <input
              className="rounded-xl border border-orange-200/70 p-3"
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white" type="submit">
              Create account
            </button>
          </form>
          <p className="mt-4 text-sm text-ink/70">
            Already a member? <Link className="text-coral" to="/login">Login</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
