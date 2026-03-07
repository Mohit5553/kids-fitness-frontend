import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';

export default function Membership() {
  const [memberships, setMemberships] = useState([]);
  const [plans, setPlans] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [cardForm, setCardForm] = useState({ name: '', number: '', expiry: '', cvc: '' });

  useEffect(() => {
    api.get('/memberships/mine').then((res) => setMemberships(res.data || [])).catch(() => {});
    api.get('/plans').then((res) => setPlans(res.data || [])).catch(() => {});
  }, []);

  const openCheckout = (plan) => {
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

      const membership = await api.post('/memberships', {
        planId: selectedPlan._id,
        paymentId: payment.data._id
      });

      setMemberships((prev) => [membership.data, ...prev]);
      setMessage('Payment successful. Membership activated.');
      closeCheckout();
    } catch (err) {
      setError(err?.response?.data?.message || 'Payment failed. Try again.');
    }
  };

  return (
    <div>
      <Navbar />
      <main className="page-shell py-12">
        <h1 className="font-display text-3xl">Membership</h1>
        <p className="mt-2 text-sm text-ink/70">View plan status and renewal options.</p>
        {message ? <p className="mt-3 text-sm text-moss">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-coral">{error}</p> : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {memberships.map((membership) => (
            <div key={membership._id} className="rounded-2xl bg-white/80 p-4 shadow-glow">
              <p className="font-semibold">{membership.planId?.name}</p>
              <p className="text-xs text-ink/70">Status: {membership.status}</p>
              {membership.endDate ? (
                <p className="text-xs text-ink/70">Ends: {new Date(membership.endDate).toLocaleDateString()}</p>
              ) : null}
              {membership.classesRemaining != null ? (
                <p className="text-xs text-ink/70">Classes remaining: {membership.classesRemaining}</p>
              ) : null}
            </div>
          ))}
        </div>

        <h2 className="mt-10 font-display text-2xl">Subscribe to a plan</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan._id} className="rounded-2xl bg-white/80 p-4 shadow-glow">
              <p className="font-semibold">{plan.name}</p>
              <p className="text-sm text-ink/70">AED {plan.price}</p>
              <button
                className="mt-3 rounded-full bg-coral px-4 py-2 text-xs font-semibold text-white"
                onClick={() => openCheckout(plan)}
              >
                Pay now
              </button>
            </div>
          ))}
        </div>
      </main>
      {showCheckout ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-glow">
            <h3 className="font-display text-2xl">Secure checkout</h3>
            <p className="mt-1 text-sm text-ink/70">
              Test mode only. No real charge will be made.
            </p>
            <form className="mt-4 grid gap-3" onSubmit={handleCheckout}>
              <input
                className="rounded-xl border border-orange-200/70 p-3"
                name="name"
                placeholder="Name on card"
                value={cardForm.name}
                onChange={handleCardChange}
              />
              <input
                className="rounded-xl border border-orange-200/70 p-3"
                name="number"
                placeholder="Card number"
                value={cardForm.number}
                onChange={handleCardChange}
              />
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="rounded-xl border border-orange-200/70 p-3"
                  name="expiry"
                  placeholder="MM/YY"
                  value={cardForm.expiry}
                  onChange={handleCardChange}
                />
                <input
                  className="rounded-xl border border-orange-200/70 p-3"
                  name="cvc"
                  placeholder="CVC"
                  value={cardForm.cvc}
                  onChange={handleCardChange}
                />
              </div>
              <button className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white" type="submit">
                Pay AED {selectedPlan?.price}
              </button>
              <button
                type="button"
                className="rounded-full border border-ink/10 px-5 py-3 text-sm font-semibold text-ink"
                onClick={closeCheckout}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      ) : null}
      <Footer />
    </div>
  );
}

