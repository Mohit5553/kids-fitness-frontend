import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';

const emptyForm = {
  name: '',
  price: '',
  validity: '',
  type: 'pack',
  classesIncluded: '',
  durationWeeks: '',
  benefits: ''
};

export default function PricingManagement() {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [message, setMessage] = useState('');

  const load = () => {
    api.get('/plans').then((res) => setPlans(res.data || [])).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleEdit = (plan) => {
    setEditingId(plan._id);
    setForm({
      name: plan.name || '',
      price: plan.price ?? '',
      validity: plan.validity || '',
      type: plan.type || 'pack',
      classesIncluded: plan.classesIncluded ?? '',
      durationWeeks: plan.durationWeeks ?? '',
      benefits: (plan.benefits || []).join(', ')
    });
  };

  const handleCancel = () => {
    setEditingId('');
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    const payload = {
      ...form,
      price: Number(form.price),
      classesIncluded: form.classesIncluded ? Number(form.classesIncluded) : undefined,
      durationWeeks: form.durationWeeks ? Number(form.durationWeeks) : undefined,
      benefits: form.benefits.split(',').map((item) => item.trim()).filter(Boolean)
    };

    try {
      if (editingId) {
        await api.put(`/plans/${editingId}`, payload);
        setMessage('Plan updated.');
      } else {
        await api.post('/plans', payload);
        setMessage('Plan created.');
      }
      handleCancel();
      load();
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Unable to save plan.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this plan?')) return;
    await api.delete(`/plans/${id}`);
    load();
  };

  return (
    <div>
      <Navbar />
      <main className="page-shell py-12">
        <h1 className="font-display text-3xl">Pricing Management</h1>
        <p className="mt-2 text-sm text-ink/70">Update plan pricing and benefits.</p>
        {message ? <p className="mt-3 text-sm text-coral">{message}</p> : null}

        <form className="mt-6 grid gap-3 rounded-3xl bg-white/80 p-6 shadow-glow" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="rounded-xl border border-orange-200/70 p-3"
              name="name"
              placeholder="Plan name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              className="rounded-xl border border-orange-200/70 p-3"
              name="price"
              type="number"
              placeholder="Price"
              value={form.price}
              onChange={handleChange}
              required
            />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="rounded-xl border border-orange-200/70 p-3"
              name="validity"
              placeholder="Validity (e.g. 8 weeks)"
              value={form.validity}
              onChange={handleChange}
            />
            <select
              className="rounded-xl border border-orange-200/70 p-3"
              name="type"
              value={form.type}
              onChange={handleChange}
            >
              <option value="dropin">Drop-in</option>
              <option value="pack">Pack</option>
              <option value="term">Term</option>
            </select>
            <input
              className="rounded-xl border border-orange-200/70 p-3"
              name="classesIncluded"
              type="number"
              placeholder="Classes included"
              value={form.classesIncluded}
              onChange={handleChange}
            />
          </div>
          <input
            className="rounded-xl border border-orange-200/70 p-3"
            name="durationWeeks"
            type="number"
            placeholder="Duration (weeks)"
            value={form.durationWeeks}
            onChange={handleChange}
          />
          <textarea
            className="min-h-[90px] rounded-xl border border-orange-200/70 p-3"
            name="benefits"
            placeholder="Benefits (comma separated)"
            value={form.benefits}
            onChange={handleChange}
          />
          <div className="flex flex-wrap gap-3">
            <button className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white" type="submit">
              {editingId ? 'Update plan' : 'Create plan'}
            </button>
            {editingId ? (
              <button
                type="button"
                className="rounded-full border border-ink/10 px-5 py-3 text-sm font-semibold text-ink"
                onClick={handleCancel}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {plans.map((plan) => (
            <div key={plan._id} className="rounded-2xl bg-white/80 p-4 shadow-glow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{plan.name}</p>
                  <p className="text-xs text-ink/70">{plan.validity}</p>
                  <p className="text-xs text-ink/70">Type: {plan.type}</p>
                </div>
                <p className="text-sm font-semibold text-ocean">AED {plan.price}</p>
              </div>
              <div className="mt-3 flex gap-3">
                <button
                  className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold"
                  onClick={() => handleEdit(plan)}
                >
                  Edit
                </button>
                <button
                  className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold"
                  onClick={() => handleDelete(plan._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

