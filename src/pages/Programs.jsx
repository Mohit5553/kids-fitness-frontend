import { useEffect, useState, useMemo } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import SectionTitle from '../components/SectionTitle.jsx';
import ClassCard from '../components/ClassCard.jsx';
import LocationPicker from '../components/LocationPicker.jsx';
import api from '../api/api.js';

export default function Programs() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAge, setSelectedAge] = useState('All');

  const fetchClasses = () => {
    setLoading(true);
    api
      .get('/classes')
      .then((res) => {
        if (Array.isArray(res.data)) {
          setClasses(res.data);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClasses();
    const handleChange = () => fetchClasses();
    window.addEventListener('location-change', handleChange);
    return () => window.removeEventListener('location-change', handleChange);
  }, []);

  const ageGroups = useMemo(() => {
    const groups = ['All', ...new Set(classes.map(c => c.ageGroup).filter(Boolean))];
    return groups;
  }, [classes]);

  const filteredClasses = useMemo(() => {
    return classes.filter(item => {
      const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAge = selectedAge === 'All' || item.ageGroup === selectedAge;
      return matchesSearch && matchesAge;
    });
  }, [classes, searchTerm, selectedAge]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="page-shell flex-1 py-12">
        <div className="pt-4 md:pt-8">
          <SectionTitle
            kicker="Programs"
            title="Choose a class path"
            subtitle="Browse our core classes and build a schedule that fits your child."
          />
        </div>

        {/* Filters Section */}
        <div className="mt-8 mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md">
          <div className="group flex-1 max-w-md relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-ink/30 group-focus-within:text-brand-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" 
              placeholder="Search for classes..."
              className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-brand-blue/20 focus:bg-white transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-ink/30 uppercase tracking-widest">Age Group:</span>
              <select 
                className="bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-bold text-ink/70 focus:ring-2 focus:ring-brand-blue/20 outline-none cursor-pointer hover:bg-slate-100 transition-all"
                value={selectedAge}
                onChange={(e) => setSelectedAge(e.target.value)}
              >
                {ageGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>

            <div className="h-10 w-[1px] bg-slate-100 hidden md:block mx-2"></div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-ink/30 uppercase tracking-widest">Branch:</span>
              <LocationPicker compact />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-80 animate-pulse bg-white border border-slate-100 rounded-[32px] shadow-sm"></div>
            ))}
          </div>
        ) : filteredClasses.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3 animate-rise">
            {filteredClasses.map((item) => (
              <ClassCard key={item._id || item.title} item={item} />
            ))}
          </div>
        ) : (
          <div className="mt-12 py-16 text-center bg-white rounded-[48px] border border-dashed border-slate-200">
             <div className="text-4xl mb-4 grayscale opacity-30">🔍</div>
             <h3 className="font-display text-xl font-black text-ink">No matching classes</h3>
             <p className="mt-2 text-ink/50 font-medium">Try adjusting your filters or searching for something else.</p>
             <button 
               onClick={() => { setSearchTerm(''); setSelectedAge('All'); }}
               className="mt-6 text-brand-blue font-bold text-sm hover:underline"
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
