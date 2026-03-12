import { useEffect, useState, useMemo } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import SectionTitle from '../components/SectionTitle.jsx';
import LocationPicker from '../components/LocationPicker.jsx';
import api from '../api/api.js';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const formatTime = (value) =>
  new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export default function Schedule() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState('');

  const fetchSessions = () => {
    setLoading(true);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setDate(end.getDate() + 7);

    api
      .get('/sessions', { params: { start: start.toISOString(), end: end.toISOString() } })
      .then((res) => {
        setSessions(res.data || []);
        setLoading(false);
      })
      .catch(() => {
        setSessions([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSessions();
    const handleChange = () => fetchSessions();
    window.addEventListener('location-change', handleChange);
    return () => window.removeEventListener('location-change', handleChange);
  }, []);

  const grouped = useMemo(() => {
    const data = sessions.reduce((acc, session) => {
      const day = new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'long' });
      if (!acc[day]) acc[day] = [];
      acc[day].push(session);
      return acc;
    }, {});

    const sortedDays = daysOfWeek.filter((day) => data[day]).map((day) => ({ day, sessions: data[day] }));
    
    // Set initial active day if not set
    if (!activeDay && sortedDays.length > 0) {
      // Find today first, if exists in schedule
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const hasToday = sortedDays.find(d => d.day === today);
      setActiveDay(hasToday ? today : sortedDays[0].day);
    }

    return sortedDays;
  }, [sessions]);

  const activeSessions = useMemo(() => {
    return grouped.find(g => g.day === activeDay)?.sessions || [];
  }, [grouped, activeDay]);

  return (
    <div className="min-vh-100 flex flex-col overflow-x-hidden">
      <Navbar />
      
      {/* Dynamic Header */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        <div className="section-grid absolute inset-0 opacity-40" />
        <div className="page-shell relative z-10 flex flex-col items-center">
          <SectionTitle
            kicker="The Rhythm"
            title="Weekly Schedule"
            subtitle="Find the perfect session for your little champion. Select a location to see local branch times."
            center
          />
          
          <div className="mt-12 w-full max-w-2xl">
            <LocationPicker compact />
          </div>
        </div>
      </section>

      <main className="page-shell flex-1 pb-24">
        {/* Modern Tab Bar */}
        <div className="sticky top-20 z-40 -mx-4 mb-16 flex justify-center px-4 md:top-24">
          <div className="pill-nav flex w-full max-w-4xl gap-1 overflow-x-auto rounded-full p-1.5 backdrop-blur-xl scrollbar-hide md:gap-2">
            {daysOfWeek.map((day) => {
              const hasSessions = grouped.find(g => g.day === day);
              return (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  disabled={!hasSessions && !loading}
                  className={`relative flex-1 min-w-[110px] whitespace-nowrap rounded-full px-6 py-3.5 text-sm font-black transition-all duration-300 ${
                    activeDay === day
                      ? 'bg-brand-blue text-white shadow-xl shadow-brand-blue/30 scale-105'
                      : !hasSessions && !loading
                      ? 'opacity-20 grayscale cursor-not-allowed'
                      : 'text-brand-black/50 hover:bg-white hover:text-brand-black hover:shadow-sm'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Section */}
        <div className="relative min-h-[400px]">
          {loading ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="soft-card h-72 animate-pulse rounded-[40px] opacity-40" />
              ))}
            </div>
          ) : activeSessions.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {activeSessions.map((session) => (
                <div 
                  key={session._id} 
                  className="soft-card group relative flex flex-col justify-between overflow-hidden rounded-[40px] p-10 transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_40px_80px_-20px_rgba(11,27,58,0.25)]"
                >
                  {/* Glass background sparkle effect */}
                  <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand-blue/5 blur-[80px] transition-all duration-700 group-hover:bg-brand-blue/15 group-hover:scale-150" />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-2.5">
                        <span className="rounded-xl bg-brand-blue px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-white shadow-lg shadow-brand-blue/20 w-fit">
                          {session.classId?.ageGroup || 'All Ages'}
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] font-black text-brand-black/40 uppercase tracking-widest pl-1">
                          <span className="text-brand-blue text-xs">📍</span> {session.location || 'Main Studio'}
                        </span>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-[inset_0_-4px_10px_rgba(0,0,0,0.05)] text-2xl transition-all duration-500 group-hover:rotate-12 group-hover:scale-110">
                        🏃‍♂️
                      </div>
                    </div>

                    <h4 className="mt-8 font-display text-2xl font-black leading-[1.15] tracking-tight text-brand-black lg:text-3xl">
                      {session.classId?.title?.split('. AED')[0]}
                    </h4>
                    
                    {/* Price Badge */}
                    <div className="mt-4 flex items-center gap-2">
                       <span className="text-lg font-black text-brand-blue">
                         AED {session.classId?.price || '150'}
                       </span>
                       <span className="text-[10px] font-bold uppercase tracking-widest text-brand-black/30">/ Session</span>
                    </div>

                    <p className="mt-5 line-clamp-2 text-sm font-medium leading-relaxed text-brand-black/50">
                      {session.classId?.description || 'Build strength, agility, and confidence in our signature kids fitness programs.'}
                    </p>

                    <div className="mt-10 grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-4 rounded-[24px] bg-white/50 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 group-hover:bg-white/80 group-hover:shadow-md">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-tighter text-brand-black/20">Start</span>
                          <span className="text-sm font-black text-brand-black">{formatTime(session.startTime)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 rounded-[24px] bg-white/50 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 group-hover:bg-white/80 group-hover:shadow-md">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-brand-blue">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-tighter text-brand-black/20">Coach</span>
                          <span className="text-sm font-black text-brand-black truncate">{session.trainerId?.name?.split(' ')[0] || 'TBD'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      </div>
                      <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">Open Slot</span>
                    </div>
                    <button className="rounded-2xl bg-brand-black px-8 py-4 text-[13px] font-black uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 group-hover:bg-brand-blue group-hover:-translate-y-1 group-hover:shadow-brand-blue/30">
                      Book Now
                    </button>
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[40px] bg-white/30 p-20 text-center backdrop-blur-md border border-white/40 animate-in fade-in scale-in-95 duration-500">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl text-5xl">
                🗓️
              </div>
              <h3 className="mt-8 font-display text-3xl font-black text-brand-black">No classes today</h3>
              <p className="mt-3 max-w-sm text-lg font-medium text-brand-black/40">
                It's a quiet day! Try switching to another date above or check a different location.
              </p>
              <button 
                onClick={() => {
                  const firstWithSessions = grouped[0]?.day;
                  if (firstWithSessions) setActiveDay(firstWithSessions);
                }}
                className="mt-8 rounded-full border-2 border-brand-black/10 px-8 py-3 font-black text-brand-black transition-all hover:bg-brand-black hover:text-white"
              >
                Show nearby class
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
