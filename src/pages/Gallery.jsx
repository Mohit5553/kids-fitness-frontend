import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import SectionTitle from '../components/SectionTitle.jsx';
import g1 from '../assets/gallery-1.svg';
import g2 from '../assets/gallery-2.svg';
import g3 from '../assets/gallery-3.svg';
import g4 from '../assets/gallery-4.svg';
import g5 from '../assets/gallery-5.svg';
import g6 from '../assets/gallery-6.svg';

const gallery = [
  { label: 'Balance beams', image: g1 },
  { label: 'Parent + child sessions', image: g2 },
  { label: 'Team challenges', image: g3 },
  { label: 'Ballet stretch flow', image: g4 },
  { label: 'Combat focus drills', image: g5 },
  { label: 'Active play circuits', image: g6 }
];

export default function Gallery() {
  return (
    <div>
      <Navbar />
      <main className="page-shell py-12">
        <SectionTitle
          kicker="Gallery"
          title="Inside the studio"
          subtitle="Snapshots from our sessions, events, and mini tournaments."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {gallery.map((item) => (
            <div key={item.label} className="soft-card rounded-3xl p-4">
              <img src={item.image} alt={item.label} className="h-40 w-full rounded-2xl object-cover" />
              <p className="mt-3 text-sm text-ink/70">{item.label}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
