import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import SectionTitle from '../components/SectionTitle.jsx';
import LocationPicker from '../components/LocationPicker.jsx';
import api from '../api/api.js';

const formatDate = (value) => new Date(value).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
const formatTime = (value) => new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export default function Calendar() {
  const [sessions, setSessions] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 7);

    api
      .get('/sessions', { params: { start: start.toISOString(), end: end.toISOString() } })
      .then((res) => setSessions(res.data || []))
      .catch(() => setSessions([]));
  }, []);

  useEffect(() => {
    api
      .get('/children/mine')
      .then((res) => {
        setChildren(res.data || []);
        if (res.data?.length) {
          setSelectedChild(res.data[0]._id);
        }
      })
      .catch(() => {});
  }, []);

  const grouped = useMemo(() => {
    return sessions.reduce((acc, session) => {
      const key = formatDate(session.startTime);
      if (!acc[key]) acc[key] = [];
      acc[key].push(session);
      return acc;
    }, {});
  }, [sessions]);

  const handleBook = async (sessionId) => {
    setMessage('');
    if (!selectedChild) {
      setMessage('Please register a child first.');
      return;
    }
    try {
      await api.post('/bookings', { sessionId, childId: selectedChild });
      setMessage('Booking confirmed. Check your dashboard.');
    } catch (err) {
      setMessage('Unable to book this session.');
    }
  };

  return (
    <div>
      <Navbar />
      <main className="page-shell py-12">
        <SectionTitle
          kicker="Class calendar"
          title="Book from the weekly schedule"
          subtitle="Pick a session and reserve your spot."
        />
        <div className="mb-6">
          <LocationPicker compact />
        </div>
        {message ? <p className="mb-4 text-sm text-coral">{message}</p> : null}
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-white/80 p-4 shadow-glow">
          <label className="text-sm text-ink/70">Child</label>
          <select
            className="rounded-xl border border-orange-200/70 p-2 text-sm"
            value={selectedChild}
            onChange={(event) => setSelectedChild(event.target.value)}
          >
            {children.map((child) => (
              <option key={child._id} value={child._id}>
                {child.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-8">
          {Object.entries(grouped).map(([day, daySessions]) => (
            <div key={day}>
              <h3 className="font-display text-xl">{day}</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {daySessions.map((session) => (
                  <div key={session._id} className="rounded-2xl bg-white/80 p-5 shadow-glow">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ocean">
                      {session.classId?.ageGroup || 'All ages'}
                    </p>
                    <h4 className="mt-2 font-display text-lg">{session.classId?.title}</h4>
                    <p className="text-sm text-ink/70">{formatTime(session.startTime)}</p>
                    <p className="text-sm text-ink/70">
                      Trainer: {session.trainerId?.name || 'TBA'}
                    </p>
                    <button
                      className="mt-4 rounded-full bg-coral px-4 py-2 text-xs font-semibold text-white"
                      onClick={() => handleBook(session._id)}
                    >
                      Book class
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
