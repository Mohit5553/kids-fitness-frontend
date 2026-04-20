import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';
import { usePermissions } from '../../hooks/usePermissions.js';

const emptyForm = {
  name: '',
  price: '',
  validity: '',
  validityValue: '',
  validityUnit: 'weeks',
  type: 'pack',
  classesIncluded: '',
  durationWeeks: '',
  durationValue: '',
  durationUnit: 'weeks',
  billingCycle: 'none',
  benefits: '',
  tagline: '',
  isFeatured: false,
  isUnlimited: false,
  sessionType: 'group',
  validDays: 'both',
  timeSlots: '',
  trainerAllocation: 'random',
  trainerId: '',
  maxAllowedMissed: 2,
  expiryBufferDays: 7,
  taxId: '',
  creditsIncluded: 0,
  dailyBookingLimit: 0,
  cancellationWindow: 6,
  allowFreezing: false,
  gender: 'mixed'
};

export default function PricingManagement() {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [trainers, setTrainers] = useState([]);
  const [taxes, setTaxes] = useState([]);

  const { can } = usePermissions();

  const canCreate = can('pricing:create');
  const canEdit = can('pricing:edit');
  const canDelete = can('pricing:delete');
  const canToggle = can('pricing:edit');

  const load = () => {
    setLoading(true);
    api.get('/plans?all=true')
      .then((res) => setPlans(res.data || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  };

  const loadTrainers = () => {
    api.get('/trainers')
      .then(res => setTrainers(res.data || []))
      .catch(() => {});
  };

  const loadTaxes = () => {
    api.get('/taxes')
      .then(res => setTaxes(res.data.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    load();
    loadTrainers();
    loadTaxes();
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
      validityValue: plan.validityValue ?? '',
      validityUnit: plan.validityUnit || 'weeks',
      type: plan.type || 'pack',
      classesIncluded: plan.classesIncluded ?? '',
      durationWeeks: plan.durationWeeks ?? '',
      durationValue: plan.durationValue ?? '',
      durationUnit: plan.durationUnit || 'weeks',
      billingCycle: plan.billingCycle || 'none',
      benefits: (plan.benefits || []).join(', '),
      tagline: plan.tagline || '',
      isFeatured: !!plan.isFeatured,
      isUnlimited: plan.classesIncluded === 0,
      sessionType: plan.sessionType || 'group',
      validDays: plan.validDays || 'both',
      timeSlots: (plan.timeSlots || []).join(', '),
      trainerAllocation: plan.trainerAllocation || 'random',
      trainerId: plan.trainerId?._id || plan.trainerId || '',
      maxAllowedMissed: plan.extensionRules?.maxAllowedMissed ?? 2,
      expiryBufferDays: plan.extensionRules?.expiryBufferDays ?? 7,
      cancellationWindow: plan.extensionRules?.cancellationWindow ?? 6,
      allowFreezing: !!plan.extensionRules?.allowFreezing,
      taxId: plan.taxId?._id || plan.taxId || '',
      creditsIncluded: plan.creditsIncluded ?? 0,
      dailyBookingLimit: plan.dailyBookingLimit ?? 0,
      gender: plan.gender || 'mixed'
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
      classesIncluded: form.isUnlimited ? 0 : (form.classesIncluded ? Number(form.classesIncluded) : undefined),
      durationWeeks: form.durationWeeks ? Number(form.durationWeeks) : undefined,
      durationValue: form.durationValue ? Number(form.durationValue) : undefined,
      durationUnit: form.durationUnit,
      validityValue: form.validityValue ? Number(form.validityValue) : undefined,
      validityUnit: form.validityUnit,
      benefits: form.benefits.split(',').map((item) => item.trim()).filter(Boolean),
      timeSlots: form.timeSlots.split(',').map((item) => item.trim()).filter(Boolean),
      extensionRules: {
        maxAllowedMissed: Number(form.maxAllowedMissed),
        expiryBufferDays: Number(form.expiryBufferDays),
        cancellationWindow: Number(form.cancellationWindow),
        allowFreezing: Boolean(form.allowFreezing)
      },
      creditsIncluded: Number(form.creditsIncluded || 0),
      dailyBookingLimit: Number(form.dailyBookingLimit || 0),
      trainerId: (form.trainerAllocation === 'fixed' && form.trainerId) ? form.trainerId : null
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

  const handleToggleStatus = async (plan) => {
    const action = plan.status === 'active' ? 'disable' : 'enable';
    if (!window.confirm(`Are you sure you want to ${action} this plan?`)) return;
    try {
      await api.patch(`/plans/${plan._id}/status`, { status: action === 'disable' ? 'inactive' : 'active' });
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || `Failed to ${action} plan`);
    }
  };

  return (
    <div>
      <Navbar />
      <main className="page-shell py-12">
        <h1 className="font-display text-3xl">Add Membership</h1>
        <p className="mt-2 text-sm text-ink/70">Update plan pricing and benefits.</p>
        {message ? <p className="mt-3 text-sm text-coral">{message}</p> : null}

        {canCreate || (editingId && canEdit) ? (
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
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-ink/40 px-1">Validity</label>
                  <input
                    className="w-full rounded-xl border border-orange-200/70 p-3"
                    name="validityValue"
                    type="number"
                    placeholder="Val"
                    value={form.validityValue}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-ink/40 px-1">Unit</label>
                  <select
                    className="w-full rounded-xl border border-orange-200/70 p-3"
                    name="validityUnit"
                    value={form.validityUnit}
                    onChange={handleChange}
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-ink/40 px-1">Plan Category</label>
                <select
                  className="w-full rounded-xl border border-orange-200/70 p-3"
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                >
                  <option value="dropin">Drop-in</option>
                  <option value="pack">Pack / Packaged</option>
                  <option value="term">Term / Weekly</option>
                  <option value="subscription">Subscription</option>
                  <option value="time-based">Time-Based Access</option>
                  <option value="credit-based">Credit-Based</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-ink/40 px-1">Duration</label>
                  <input
                    className="w-full rounded-xl border border-orange-200/70 p-3"
                    name="durationValue"
                    type="number"
                    placeholder="Dur"
                    value={form.durationValue}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-ink/40 px-1">Unit</label>
                  <select
                    className="w-full rounded-xl border border-orange-200/70 p-3"
                    name="durationUnit"
                    value={form.durationUnit}
                    onChange={handleChange}
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>

              <div className="relative">
                <label className="text-[10px] font-bold uppercase text-ink/40 px-1">Sessions</label>
                <input
                  className={`w-full rounded-xl border border-orange-200/70 p-3 ${form.isUnlimited || form.type === 'credit-based' ? 'bg-slate-50 text-ink/20' : ''}`}
                  name="classesIncluded"
                  type="number"
                  placeholder="Classes included"
                  value={form.isUnlimited || form.type === 'credit-based' ? '' : form.classesIncluded}
                  onChange={handleChange}
                  disabled={form.isUnlimited || form.type === 'credit-based'}
                />
                <div className="mt-2 flex items-center gap-2 px-1">
                  <input
                    type="checkbox"
                    id="isUnlimited"
                    checked={form.isUnlimited}
                    onChange={(e) => setForm(prev => ({ ...prev, isUnlimited: e.target.checked }))}
                    className="h-4 w-4 rounded border-orange-200 text-coral focus:ring-coral"
                  />
                  <label htmlFor="isUnlimited" className="text-[10px] font-bold uppercase text-ink/40">Unlimited Sessions</label>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4 border-t border-slate-50 pt-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-ink/40 uppercase ml-2">Daily Booking Limit</label>
                <input
                  className="w-full rounded-xl border border-orange-200/70 p-3"
                  name="dailyBookingLimit"
                  type="number"
                  placeholder="Daily Limit (0=∞)"
                  value={form.dailyBookingLimit}
                  onChange={handleChange}
                />
              </div>

              {form.type === 'credit-based' && (
                <div className="space-y-1">
                   <label className="text-[9px] font-bold text-ink/40 uppercase ml-2">Total Credits</label>
                   <input
                     className="w-full rounded-xl border border-orange-200/70 p-3 bg-indigo-50/30"
                     name="creditsIncluded"
                     type="number"
                     placeholder="Credits"
                     value={form.creditsIncluded}
                     onChange={handleChange}
                   />
                </div>
              )}

              <div className="space-y-1">
                 <label className="text-[9px] font-bold text-ink/40 uppercase ml-2">Cancel Window (hrs)</label>
                 <input
                   className="w-full rounded-xl border border-orange-200/70 p-3"
                   name="cancellationWindow"
                   type="number"
                   placeholder="Window (e.g. 6)"
                   value={form.cancellationWindow}
                   onChange={handleChange}
                 />
              </div>

              <div className="flex items-center gap-3 px-3 pt-4">
                  <input
                    type="checkbox"
                    id="allowFreezing"
                    checked={form.allowFreezing}
                    onChange={(e) => setForm(prev => ({ ...prev, allowFreezing: e.target.checked }))}
                    className="h-5 w-5 rounded border-orange-200 text-brand-blue"
                  />
                  <label htmlFor="allowFreezing" className="text-[10px] font-bold uppercase text-ink/40">Allow Freezing</label>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="md:col-span-1" />
              {form.type === 'subscription' && (
                <select
                  className="rounded-xl border border-orange-200/70 p-3"
                  name="billingCycle"
                  value={form.billingCycle}
                  onChange={handleChange}
                >
                  <option value="none">Cycle (None)</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              )}
              <input
                className={`rounded-xl border border-orange-200/70 p-3 ${form.type === 'subscription' ? '' : 'md:col-span-2'}`}
                name="tagline"
                placeholder="Tagline (e.g. Family favorite)"
                value={form.tagline}
                onChange={handleChange}
              />
              <div className={`flex items-center gap-3 px-3 ${form.type === 'subscription' ? '' : 'md:col-span-1'}`}>
                <input
                  type="checkbox"
                  name="isFeatured"
                  id="isFeatured"
                  checked={form.isFeatured}
                  onChange={(e) => setForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                  className="h-5 w-5 rounded border-orange-200 text-coral focus:ring-coral"
                />
                <label htmlFor="isFeatured" className="text-sm font-medium text-ink/70">Featured (Best Value)</label>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-ink/40 px-1">Session Type</label>
                <select className="w-full rounded-xl border border-orange-200/70 p-3 text-sm" name="sessionType" value={form.sessionType} onChange={handleChange}>
                  <option value="group">Group Session</option>
                  <option value="personal">Personal Training</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-ink/40 px-1">Valid Days</label>
                <select className="w-full rounded-xl border border-orange-200/70 p-3 text-sm" name="validDays" value={form.validDays} onChange={handleChange}>
                  <option value="weekday">Weekdays (Mon-Fri)</option>
                  <option value="weekend">Weekends (Sat-Sun)</option>
                  <option value="both">All Days</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-ink/40 px-1">Target Gender</label>
                <select className="w-full rounded-xl border border-orange-200/70 p-3 text-sm" name="gender" value={form.gender} onChange={handleChange}>
                  <option value="mixed">Mixed (All)</option>
                  <option value="male">Male Only</option>
                  <option value="female">Female Only</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-ink/40 px-1">Trainer allocation</label>
                <select className="w-full rounded-xl border border-orange-200/70 p-3 text-sm" name="trainerAllocation" value={form.trainerAllocation} onChange={handleChange}>
                  <option value="random">Random (Auto)</option>
                  <option value="fixed">Fixed (Manual)</option>
                </select>
              </div>

              {form.trainerAllocation === 'fixed' ? (
                <div className="space-y-1 animate-rise">
                    <label className="text-[10px] font-bold uppercase text-ink/40 px-1">Select Fixed Trainer</label>
                    <select 
                        className="w-full rounded-xl border border-orange-200/70 p-3 text-sm" 
                        name="trainerId" 
                        value={form.trainerId} 
                        onChange={handleChange}
                        required={form.trainerAllocation === 'fixed'}
                    >
                        <option value="">Choose a trainer...</option>
                        {trainers.map(t => (
                            <option key={t._id} value={t._id}>{t.name}</option>
                        ))}
                    </select>
                </div>
              ) : (
                <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-ink/40 px-1">Time Slots (comma separated)</label>
                    <input className="w-full rounded-xl border border-orange-200/70 p-3 text-sm" name="timeSlots" placeholder="10:00 AM, 04:00 PM" value={form.timeSlots} onChange={handleChange} />
                </div>
              )}
            </div>

            {form.trainerAllocation === 'fixed' && (
                <div className="grid gap-3 md:grid-cols-1">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-ink/40 px-1">Time Slots (comma separated)</label>
                        <input className="w-full rounded-xl border border-orange-200/70 p-3 text-sm" name="timeSlots" placeholder="10:00 AM, 04:00 PM" value={form.timeSlots} onChange={handleChange} />
                    </div>
                </div>
            )}
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-ink/40 px-1">Max Missed Sessions (Allow rescue)</label>
                <input className="w-full rounded-xl border border-orange-200/70 p-3" name="maxAllowedMissed" type="number" value={form.maxAllowedMissed} onChange={handleChange} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-ink/40 px-1">Expiry Buffer (Days)</label>
                <input className="w-full rounded-xl border border-orange-200/70 p-3" name="expiryBufferDays" type="number" value={form.expiryBufferDays} onChange={handleChange} />
              </div>
              <div className="space-y-1 md:col-span-1">
                <label className="text-[10px] font-bold uppercase text-ink/40 px-1">Applied Tax Rule</label>
                <select 
                  className="w-full rounded-xl border border-orange-200/70 p-3 text-sm" 
                  name="taxId" 
                  value={form.taxId} 
                  onChange={handleChange}
                >
                  <option value="">No Tax (Tax Exempt)</option>
                  {taxes.map(t => (
                    <option key={t._id} value={t._id}>{t.name} ({t.value}{t.type === 'percentage' ? '%' : ' AED'}) - {t.locationId?.name || 'All'}</option>
                  ))}
                </select>
              </div>
            </div>
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
        ) : (
          <div className="mt-6 p-6 bg-white/50 rounded-3xl border border-dashed border-slate-200 text-center">
            <p className="text-sm font-bold text-ink/30 italic">You don't have permission to {editingId ? 'edit' : 'create'} plans.</p>
          </div>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {loading ? (
            Array(4).fill(0).map((_, i) => <div key={i} className="h-32 animate-pulse bg-white rounded-2xl" />)
          ) : plans.map((plan) => (
            <div key={plan._id} className="rounded-2xl bg-white/80 p-4 shadow-glow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{plan.name}</p>
                  <p className="text-xs text-ink/70">{plan.validity}</p>
                  <p className="text-xs text-ink/70">
                    {plan.classesIncluded === 0 ? '∞ Unlimited Classes' : (plan.type === 'credit-based' ? `${plan.creditsIncluded} Total Credits` : `${plan.classesIncluded} Classes`)}
                  </p>
                  <p className="text-xs text-ink/70">
                    Type: <span className="capitalize">{plan.type?.replace('-', ' ')}</span>
                    {plan.type === 'subscription' && plan.billingCycle !== 'none' && ` (${plan.billingCycle})`}
                  </p>
                  {plan.dailyBookingLimit > 0 && (
                     <p className="text-[9px] font-bold text-coral uppercase tracking-tighter">Max {plan.dailyBookingLimit} bookings/day</p>
                  )}
                </div>
                <p className="text-sm font-semibold text-ocean">AED {plan.price}</p>
              </div>
              <div className="mt-3 flex gap-3">
                {canEdit && (
                  <button
                    className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold"
                    onClick={() => handleEdit(plan)}
                  >
                    Edit
                  </button>
                )}
                {canToggle && (
                  <button
                    className={`rounded-full px-4 py-1 text-xs font-semibold transition-all ${plan.status === 'active' ? 'bg-red-50 text-red-400 border border-red-100 hover:bg-red-100' : 'bg-green-50 text-green-500 border border-green-100 hover:bg-green-100'}`}
                    onClick={() => handleToggleStatus(plan)}
                  >
                    {plan.status === 'active' ? 'Disable' : 'Enable'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
