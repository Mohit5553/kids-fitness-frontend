import { Link } from 'react-router-dom';

export default function ClassCard({ item }) {
  return (
    <div className="soft-card rounded-[40px] p-6 transition-all hover:-translate-y-2 hover:shadow-2xl group border border-slate-100/50">
      {item.image ? (
        <div className="overflow-hidden rounded-[32px] mb-6">
          <img
            src={item.image}
            alt={item.title}
            className="h-48 w-full object-cover transition-transform group-hover:scale-110"
            loading="lazy"
          />
        </div>
      ) : null}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-ocean bg-ocean/5 px-4 py-1.5 rounded-full">{item.ageGroup}</span>
        <span className="text-lg font-black text-brand-blue">AED {item.price}</span>
      </div>
      <h3 className="font-display text-2xl text-ink leading-tight">{item.title}</h3>
      <p className="mt-3 text-sm text-ink/60 line-clamp-3 font-medium leading-relaxed">{item.description}</p>
      <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
        <span className="text-xs font-bold text-ink/30 uppercase tracking-widest">{item.duration}</span>
        <Link 
          to={`/book?classId=${item._id}`}
          className="bg-brand-blue text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          Book Now
        </Link>
      </div>
    </div>
  );
}
