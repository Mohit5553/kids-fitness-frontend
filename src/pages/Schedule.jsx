import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import LocationPicker from '../components/LocationPicker.jsx';
import api from '../api/api.js';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const formatTime = (value) =>
  new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export default function Schedule() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(daysOfWeek[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);
  const [searchTerm, setSearchTerm] = useState('');

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

    return daysOfWeek.reduce((acc, day) => {
      if (data[day]) {
        acc[day] = data[day].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
      }
      return acc;
    }, {});
  }, [sessions]);

  // Combined filtering: Day + Search
  const filteredSessions = useMemo(() => {
    const daySessions = grouped[selectedDay] || [];
    if (!searchTerm) return daySessions;

    return daySessions.filter(s =>
      s.classId?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.trainerId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [grouped, selectedDay, searchTerm]);

  // Ensure current day is selected if data exists for it, otherwise first available day
  useEffect(() => {
    if (!loading && sessions.length > 0) {
      if (!grouped[selectedDay]) {
        const availableDay = daysOfWeek.find(d => grouped[d]);
        if (availableDay) setSelectedDay(availableDay);
      }
    }
  }, [loading, sessions, grouped]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Immersive Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-12 md:pt-16 md:pb-16">
        {/* Animated Mesh Gradients */}
        <div className="absolute inset-0 -z-10 bg-slate-50">
          <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-ocean/10 blur-[100px] animate-floaty"></div>
          <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-coral/10 blur-[100px] animate-floaty" style={{ animationDelay: '-3s' }}></div>
        </div>

        <div className="page-shell text-center">
          <div className="inline-block rounded-full bg-white/80 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-ocean backdrop-blur-sm border border-white/50 animate-rise">
            Weekly Rhythm
          </div>
          <h1 className="mt-4 font-display text-4xl md:text-6xl font-black text-brand-blue leading-tight animate-rise" style={{ animationDelay: '0.1s' }}>
            Class <span className="text-transparent bg-clip-text bg-gradient-to-r from-ocean to-coral">Schedule</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ink/60 font-medium animate-rise" style={{ animationDelay: '0.2s' }}>
            Find the perfect slot for your mini-athlete. Select your favorite branch and explore the sessions.
          </p>

          <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-4 animate-rise" style={{ animationDelay: '0.3s' }}>
            <div className="p-1 px-4 bg-white/70 backdrop-blur-xl rounded-full border border-white shadow-low inline-flex items-center gap-4">
              <span className="text-xs font-bold text-ink/40 uppercase tracking-widest ml-2">Location:</span>
              <LocationPicker compact />
            </div>

            <div className="group relative w-full max-w-xs">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-ink/30 group-focus-within:text-brand-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search classes or coaches..."
                className="w-full bg-white/70 backdrop-blur-xl border border-white rounded-full py-2.5 pl-10 pr-4 text-xs font-bold focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all shadow-low"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <main className="page-shell flex-1 pb-24">
        {/* Horizontal Day Picker */}
        <div className="sticky top-20 z-30 -mx-4 px-4 py-4 md:static md:mx-0 md:px-0 bg-slate-50/80 backdrop-blur-lg border-b border-slate-200/50 md:bg-transparent md:border-none md:backdrop-blur-none">
          <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar md:justify-center">
            {daysOfWeek.map((day) => {
              const hasClasses = !!grouped[day];
              const isSelected = selectedDay === day;

              return (
                <button
                  key={day}
                  onClick={() => { setSelectedDay(day); setSearchTerm(''); }}
                  disabled={!hasClasses && !loading}
                  className={`relative flex shrink-0 flex-col items-center rounded-2xl px-6 py-3 transition-all duration-300 ${isSelected
                      ? 'bg-brand-blue text-white shadow-xl scale-105'
                      : hasClasses
                        ? 'bg-white text-ink/70 hover:bg-slate-100 border border-slate-200 opacity-100 cursor-pointer'
                        : 'bg-slate-100 text-ink/20 border border-slate-50 opacity-50 cursor-not-allowed'
                    }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">{day.substring(0, 3)}</span>
                  <span className="mt-1 text-sm font-bold">{day}</span>
                  {isSelected && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-white/50 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sessions Filtered by Day and Search */}
        <div className="mt-12">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-[32px] bg-white border border-slate-100 shadow-sm" />
              ))}
            </div>
          ) : filteredSessions.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredSessions.map((session, index) => (
                <div
                  key={session._id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-[32px] bg-white/60 p-8 transition-all hover:-translate-y-2 hover:bg-white hover:shadow-glow border border-white/60 backdrop-blur-md animate-rise"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                    <span className="text-8xl">🏃</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <span className="rounded-full bg-ocean/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-ocean">
                          {session.classId?.ageGroup || 'All Ages'}
                        </span>
                        {(() => {
                          const available = (session.capacity || 12) - (session.bookingsCount || 0);
                          const isFull = available <= 0;
                          const isLimited = available > 0 && available <= 3;

                          return (
                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${isFull ? 'bg-slate-100 text-slate-400' :
                                isLimited ? 'bg-coral/10 text-coral' : 'bg-moss/10 text-moss'
                              }`}>
                              {isFull ? 'Fully Booked' : `${available} Slots Left`}
                            </span>
                          );
                        })()}
                      </div>
                      <span className="text-xs font-bold text-ink/30">
                        {session.location || 'Studio'}
                      </span>
                    </div>
                    <h3 className="mt-6 font-display text-2xl font-black text-ink leading-tight">
                      {session.classId?.title}
                    </h3>
                  </div>

                  <div className="mt-10 grid grid-cols-2 items-end">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-ink/60">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-coral shadow-sm">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-ink/30 leading-none">Time</p>
                          <p className="mt-1 text-sm font-black">{formatTime(session.startTime)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-ink/60">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-moss shadow-sm">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="truncate">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-ink/30 leading-none">Coach</p>
                          <p className="mt-1 text-sm font-black truncate">{session.trainerId?.name || 'Coach TBD'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <Link
                        to={`/book-trial?sessionId=${session._id}`}
                        className="group/btn flex items-center gap-2 rounded-2xl bg-brand-blue px-6 py-3 text-sm font-black text-white shadow-low transition-all hover:scale-105 active:scale-95"
                      >
                        <span>Book A Trial</span>
                        <svg className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : searchTerm ? (
            <div className="mt-8 rounded-[48px] bg-white p-16 text-center shadow-sm border border-slate-100 flex flex-col items-center animate-rise">
              <div className="mb-6 h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center text-4xl grayscale opacity-50">
                🔍
              </div>
              <h3 className="font-display text-2xl font-black text-ink">No results found</h3>
              <p className="mt-4 max-w-sm text-ink/50 font-medium">
                We couldn't find any sessions matching "{searchTerm}" for this day.
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-6 text-brand-blue font-bold text-sm hover:underline"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="mt-8 rounded-[48px] bg-white p-16 text-center shadow-sm border border-slate-100 flex flex-col items-center animate-rise">
              <div className="mb-6 h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center text-4xl grayscale opacity-50">
                📅
              </div>
              <h3 className="font-display text-2xl font-black text-ink">No Classes Today</h3>
              <p className="mt-4 max-w-sm text-ink/50 font-medium">
                We couldn't find any sessions for {selectedDay} at this location. Try selecting another day or branch!
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
