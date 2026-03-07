export default function ClassCard({ item }) {
  return (
    <div className="soft-card rounded-2xl p-5 transition hover:-translate-y-1">
      {item.image ? (
        <img
          src={item.image}
          alt={item.title}
          className="mb-4 h-36 w-full rounded-xl object-cover"
          loading="lazy"
        />
      ) : null}
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ocean">{item.ageGroup}</p>
      <h3 className="mt-3 font-display text-xl text-ink">{item.title}</h3>
      <p className="mt-2 text-sm text-ink/70">{item.description}</p>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-ink/70">{item.duration}</span>
        <span className="font-semibold text-coral">AED {item.price}</span>
      </div>
    </div>
  );
}
