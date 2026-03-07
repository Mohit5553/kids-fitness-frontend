import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import SectionTitle from '../components/SectionTitle.jsx';
import LocationPicker from '../components/LocationPicker.jsx';

const schedule = [
  { day: 'Monday', slots: ['10:00 Active Play', '15:00 Combat Crew'] },
  { day: 'Tuesday', slots: ['11:00 Ballet Flow', '16:00 Fitness Lab'] },
  { day: 'Wednesday', slots: ['09:30 Baby Movers', '17:00 Combat Crew'] },
  { day: 'Thursday', slots: ['10:30 Active Play', '18:00 Fitness Lab'] },
  { day: 'Friday', slots: ['11:30 Ballet Flow', '15:30 Active Play'] }
];

export default function Schedule() {
  return (
    <div>
      <Navbar />
      <main className="page-shell pb-12 pt-8">
        <SectionTitle
          kicker="Schedule"
          title="Schedule a class"
          subtitle="Select your location first, then explore the weekly rhythm."
        />

        <LocationPicker />

        <div className="mt-8 space-y-4">
          {schedule.map((day) => (
            <div key={day.day} className="rounded-2xl bg-white/80 p-5 shadow-glow">
              <h3 className="font-display text-lg">{day.day}</h3>
              <p className="mt-2 text-sm text-ink/70">{day.slots.join(' • ')}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
