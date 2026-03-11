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

  const fetchSessions = () => {
    setLoading(true);
    // Fetch sessions starting from the beginning of TODAY
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
      // Force English locale to match daysOfWeek array
      const day = new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'long' });
      if (!acc[day]) acc[day] = [];
      acc[day].push(session);
      return acc;
    }, {});

    // Sort days starting from Monday
    return daysOfWeek.filter((day) => data[day]).map((day) => ({ day, sessions: data[day] }));
  }, [sessions]);

  return (
    <div>
      <Navbar />
      <main className="page-shell pb-12 pt-8 text-brand-black">
        <SectionTitle
          kicker="Schedule"
          title="Class schedule"
          subtitle="Select your location first, then explore the live weekly rhythm."
        />

        <div className="mt-6 flex justify-center">
          <LocationPicker />
        </div>

        <div className="mt-12 space-y-8">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-3xl bg-white/40" />
            ))
          ) : grouped.length > 0 ? (
            grouped.map((group) => (
              <div key={group.day}>
                <h3 className="font-display text-2xl font-black text-brand-blue">{group.day}</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {group.sessions.map((session) => (
                    <div key={session._id} className="soft-card group flex flex-col justify-between rounded-3xl p-6 transition-all hover:scale-[1.02] hover:shadow-glow">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-brand-blue/60">
                            {session.classId?.ageGroup || 'All Ages'}
                          </span>
                          <span className="text-xs font-bold text-brand-black/40">
                            {session.location || 'Studio'}
                          </span>
                        </div>
                        <h4 className="mt-3 font-display text-xl font-bold leading-tight">
                          {session.classId?.title}
                        </h4>
                        <div className="mt-6 space-y-2">
                          <div className="flex items-center gap-3 text-brand-black/60">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-bold">{formatTime(session.startTime)}</span>
                          </div>
                          <div className="flex items-center gap-3 text-brand-black/60">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-sm font-bold truncate">
                              {session.trainerId?.name || 'Coach TBD'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="mt-12 rounded-3xl bg-white/40 p-12 text-center">
              <p className="text-brand-black/60">No sessions scheduled for this week in the selected location.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

