import { useEffect, useState, useMemo } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import SectionTitle from '../components/SectionTitle.jsx';
import ClassCard from '../components/ClassCard.jsx';
import LocationPicker from '../components/LocationPicker.jsx';
import api from '../api/api.js';
import classBaby from '../assets/class-baby.svg';
import classBallet from '../assets/class-ballet.svg';
import classCombat from '../assets/class-combat.svg';

const fallbackClasses = [
  {
    _id: '1',
    title: 'Active Play',
    description: 'Obstacle courses and partner games that boost agility.',
    ageGroup: '3-5 years',
    duration: '45 min',
    price: 150,
    image: classBaby
  },
  {
    _id: '2',
    title: 'Fitness Lab',
    description: 'Strength, balance, and flexibility circuits with coaches.',
    ageGroup: '7-11 years',
    duration: '60 min',
    price: 220,
    image: classCombat
  },
  {
    _id: '3',
    title: 'Ballet Flow',
    description: 'Story-based ballet for posture and musicality.',
    ageGroup: '4-6 years',
    duration: '45 min',
    price: 180,
    image: classBallet
  }
];

export default function Programs() {
  const [classes, setClasses] = useState(fallbackClasses);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAge, setSelectedAge] = useState('All');

  const fetchClasses = () => {
    api
      .get('/classes')
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setClasses(res.data);
        }
      })
      .catch(() => { });
  };

  useEffect(() => {
    fetchClasses();
    const handleChange = () => fetchClasses();
    window.addEventListener('location-change', handleChange);
    return () => window.removeEventListener('location-change', handleChange);
  }, []);

  const ageGroups = useMemo(() => {
    const ages = classes.map(c => c.ageGroup).filter(Boolean);
    return ['All', ...new Set(ages)];
  }, [classes]);

  const filtered = useMemo(() => {
    return classes.filter(item => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAge = selectedAge === 'All' || item.ageGroup === selectedAge;
      return matchesSearch && matchesAge;
    });
  }, [classes, searchTerm, selectedAge]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="page-shell py-12">
        <SectionTitle
          kicker="Programs"
          title="Choose a class path"
          subtitle="Browse our core classes and build a schedule that fits your child."
        />

        <div className="mb-8 space-y-6">
          <LocationPicker compact />

          <div className="grid gap-6 md:grid-cols-[1fr_auto]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for classes (e.g. Ballet, Play)..."
                className="w-full rounded-2xl border-2 border-brand-black/5 bg-white/50 px-6 py-4 text-sm font-medium outline-none focus:border-brand-blue/30 transition-all placeholder:text-brand-black/30"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg className="absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-black/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-black/40 mr-2">Filter by age:</span>
              {ageGroups.map(age => (
                <button
                  key={age}
                  onClick={() => setSelectedAge(age)}
                  className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${selectedAge === age
                    ? 'bg-brand-blue text-white shadow-lg'
                    : 'bg-white/70 text-brand-black/50 hover:bg-brand-blue/10 hover:text-brand-blue'
                    }`}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3">
            {filtered.map((item) => (
              <ClassCard key={item._id || item.title} item={item} />
            ))}
          </div>
        ) : (
          <div className="rounded-[32px] bg-white/40 p-16 text-center border-2 border-dashed border-brand-black/5">
            <p className="text-brand-black/40 font-medium">No programs found matching your filters.</p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedAge('All'); }}
              className="mt-4 text-sm font-bold text-brand-blue hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
