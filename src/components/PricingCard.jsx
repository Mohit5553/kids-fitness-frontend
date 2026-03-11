export default function PricingCard({ plan }) {
  return (
    <div className="soft-card rounded-2xl p-6 transition hover:-translate-y-1">
      <h3 className="font-display text-2xl text-ink">{plan.name}</h3>
      <p className="mt-2 text-3xl font-semibold text-coral">AED {plan.price}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-ink/60">{plan.validity}</p>
      <ul className="mt-4 space-y-2 text-sm text-ink/70">
        {plan.benefits.map((benefit) => (
          <li key={benefit}>{benefit}</li>
        ))}
      </ul>
    </div>
  );
}
