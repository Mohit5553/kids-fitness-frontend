import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';

export default function MyChildren() {
  const [children, setChildren] = useState([]);
  const [form, setForm] = useState({ name: '', age: '', gender: 'other' });

  const load = () => {
    api.get('/children/mine').then((res) => setChildren(res.data || [])).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    await api.post('/children', { ...form, age: Number(form.age) });
    setForm({ name: '', age: '', gender: 'other' });
    load();
  };

  return (
    <div>
      <Navbar />
      <main className="page-shell py-12">
        <h1 className="font-display text-3xl">My Children</h1>
        <p className="mt-2 text-sm text-ink/70">Register children, update profiles, and view milestones.</p>

        <form className="mt-6 grid gap-3 rounded-3xl bg-white/80 p-6 shadow-glow" onSubmit={handleCreate}>
          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="rounded-xl border border-orange-200/70 p-3"
              name="name"
              placeholder="Child name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              className="rounded-xl border border-orange-200/70 p-3"
              name="age"
              type="number"
              placeholder="Age"
              value={form.age}
              onChange={handleChange}
              required
            />
            <select
              className="rounded-xl border border-orange-200/70 p-3"
              name="gender"
              value={form.gender}
              onChange={handleChange}
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>
          <button className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white" type="submit">
            Add child
          </button>
        </form>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {children.map((child) => (
            <div key={child._id} className="rounded-2xl bg-white/80 p-4 shadow-glow">
              <p className="font-semibold">{child.name}</p>
              <p className="text-xs text-ink/70">
                Age {child.age} • <span className="capitalize">{child.gender}</span>
              </p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

