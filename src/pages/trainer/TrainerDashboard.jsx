import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';
import { getUser } from '../../utils/auth.js';
import toast from 'react-hot-toast';

export default function TrainerDashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roster, setRoster] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  
  const user = getUser();

  const loadSessions = () => {
    if (user?.trainerId) {
      setLoading(true);
      api.get(`/sessions?trainerId=${user.trainerId}`)
        .then((res) => {
          setSessions(res.data || []);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to fetch schedule:', err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleViewRoster = async (session) => {
    setSelectedSession(session);
    setLoadingRoster(true);
    setRoster([]);
    try {
      const res = await api.get(`/bookings?sessionId=${session._id}`);
      setRoster(res.data || []);
      setLoadingRoster(false);
    } catch (err) {
      toast.error('Failed to load roster');
      setLoadingRoster(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="page-shell pb-12 pt-8">
        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-coral to-orange-400 p-8 text-white shadow-glow mb-8">
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Trainer Dashboard</p>
            <h1 className="mt-3 font-display text-3xl md:text-4xl">Welcome back, {user?.name}!</h1>
            <p className="mt-2 text-sm text-white/80">Here is your upcoming class schedule.</p>
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sessions List */}
          <div className={`rounded-[32px] bg-white p-8 shadow-sm border border-slate-100 ${selectedSession ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <h2 className="font-display text-2xl text-ink mb-6">Upcoming Sessions</h2>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-coral border-t-transparent" />
              </div>
            ) : sessions.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                {sessions.map((session) => (
                  <div key={session._id} className={`rounded-2xl border p-6 transition-all ${selectedSession?._id === session._id ? 'border-coral bg-coral/5 shadow-md' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <span className="rounded-lg bg-white px-3 py-1 text-[10px] font-bold text-coral uppercase tracking-wider shadow-sm">
                        {session.classId?.title || 'Class'}
                      </span>
                      <span className={`h-2 w-2 rounded-full ${session.status === 'scheduled' ? 'bg-green-500' : 'bg-red-500'}`} title={session.status} />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-ink/70">
                        <span className="text-sm">📅</span>
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {new Date(session.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-ink/70">
                        <span className="text-sm">⏰</span>
                        <span className="text-xs font-bold">
                          {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-200/60 flex justify-between items-center">
                      <span className="text-[10px] font-black text-ink/30 uppercase tracking-[0.2em]">
                        {session.bookedParticipants} / {session.capacity} Attendees
                      </span>
                      <button 
                        onClick={() => handleViewRoster(session)}
                        className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${selectedSession?._id === session._id ? 'bg-coral text-white' : 'text-coral hover:bg-coral/10'}`}
                      >
                        {selectedSession?._id === session._id ? 'Selected' : 'View Roster'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <p className="text-slate-400 italic">No sessions scheduled for you yet.</p>
              </div>
            )}
          </div>

          {/* Roster Right Panel */}
          {selectedSession && (
            <div className="rounded-[32px] bg-white p-8 shadow-xl border border-slate-100 animate-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-display text-xl font-bold text-ink">Attendee Roster</h3>
                  <p className="text-[10px] font-black text-coral uppercase tracking-widest mt-1">
                    {selectedSession.classId?.title}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedSession(null)}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 text-ink/40 hover:bg-slate-200 transition-all font-black"
                >
                  ×
                </button>
              </div>

              {loadingRoster ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-coral border-t-transparent" />
                  <p className="text-xs font-bold text-ink/30 uppercase tracking-widest">Loading roster...</p>
                </div>
              ) : roster.length > 0 ? (
                <div className="space-y-6">
                  {roster.map((booking) => (
                    <div key={booking._id} className="p-6 rounded-[28px] bg-slate-50 border border-slate-100 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3">
                         <span className="text-[8px] font-black text-ink/10 uppercase tracking-widest">#{booking.bookingNumber}</span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4 border-b border-slate-200/50 pb-4">
                        <div>
                          <p className="text-[10px] font-black text-ink/30 uppercase tracking-widest">Parent / Contact</p>
                          <h4 className="text-sm font-black text-ink mt-0.5">{booking.userId?.name || booking.guestDetails?.name || 'Guest User'}</h4>
                          <p className="text-[10px] font-bold text-ink/50 mt-1">{booking.userId?.phone || booking.guestDetails?.phone || booking.userId?.email || 'No contact provided'}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${booking.status === 'confirmed' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-[9px] font-black text-coral uppercase tracking-widest">Participants ({booking.participants?.length})</p>
                        {booking.participants?.map((p, idx) => (
                          <div key={idx} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center text-xs font-black text-ink/20">
                              {p.name?.charAt(0) || p.childId?.name?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-black text-ink">{p.name || p.childId?.name}</p>
                              <div className="flex gap-3 mt-0.5">
                                <span className="text-[10px] font-bold text-ink/30 uppercase">{p.age || p.childId?.age} Years</span>
                                <span className="text-[10px] font-bold text-ink/30 uppercase">{p.gender || p.childId?.gender}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-200/50 flex justify-between items-center">
                         <span className="text-[9px] font-black text-ink/20 uppercase tracking-[0.2em]">{booking.paymentMethod === 'online' ? 'Paid Online' : 'Pay at Center'}</span>
                         <span className="text-[10px] font-black text-ink/70">AED {booking.totalAmount}</span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-6">
                    <button 
                       onClick={() => window.print()} 
                       className="w-full py-4 rounded-2xl bg-ink text-white text-[10px] font-black uppercase tracking-widest hover:bg-ink/90 transition-all shadow-xl"
                    >
                      Print Full Roster Report
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs font-bold text-ink/30 uppercase tracking-widest">No attendees yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
