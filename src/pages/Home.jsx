import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import SectionTitle from '../components/SectionTitle.jsx';
import ClassCard from '../components/ClassCard.jsx';
import PricingCard from '../components/PricingCard.jsx';
import heroImage from '../assets/hero-motion.svg';
import classBaby from '../assets/class-baby.svg';
import classBallet from '../assets/class-ballet.svg';
import classCombat from '../assets/class-combat.svg';

const classHighlights = [
  {
    title: 'Baby Movers',
    description: 'Gentle sensory play for balance, rhythm, and parent bonding.',
    ageGroup: '6-24 months',
    duration: '30 min',
    price: 150,
    image: classBaby
  },
  {
    title: 'Ballet Stars',
    description: 'Graceful movement, posture, and musical exploration.',
    ageGroup: '3-6 years',
    duration: '45 min',
    price: 180,
    image: classBallet
  },
  {
    title: 'Combat Crew',
    description: 'Confidence-building martial arts with safe sparring drills.',
    ageGroup: '6-10 years',
    duration: '60 min',
    price: 220,
    image: classCombat
  }
];

const plans = [
  { name: '1 Class', price: 150, validity: 'Drop-in', benefits: ['Any class', 'Trainer feedback', 'Flexible timing'] },
  {
    name: '5 Classes',
    price: 690,
    validity: '4 weeks',
    benefits: ['Priority booking', 'Skill tracker', 'Family invites']
  },
  {
    name: '12 Classes',
    price: 1290,
    validity: '10 weeks',
    benefits: ['Free uniform', 'Progress report', 'Buddy pass']
  }
];

const highlights = [
  { title: 'Member login', desc: 'Parents track classes and payments in one portal.' },
  { title: 'QR check-in', desc: 'Fast attendance capture with QR tokens.' },
  { title: 'Class calendar', desc: 'See today’s schedule and upcoming sessions.' }
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="space-y-12">
        <section className="page-shell pb-10 pt-10">
          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ocean">Kids fitness hub</p>
              <h1 className="mt-4 font-display text-4xl text-ink md:text-5xl">
                Where energy turns into confidence.
              </h1>
              <p className="mt-4 text-base text-ink/70">
                A joyful studio for movement, balance, and coordination. Book classes, track attendance, and
                manage memberships in one place.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/book-trial" className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white">
                  Book a trial
                </Link>
                <Link
                  to="/programs"
                  className="rounded-full border border-ink/10 px-5 py-3 text-sm font-semibold text-ink"
                >
                  Explore programs
                </Link>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {highlights.map((item) => (
                  <div key={item.title} className="section-soft rounded-2xl p-4">
                    <p className="text-sm font-semibold text-ink">{item.title}</p>
                    <p className="mt-2 text-xs text-ink/70">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="soft-card rounded-[32px] p-6">
              <img src={heroImage} alt="Kids fitness energy" className="w-full rounded-3xl" />
              <div className="mt-6 rounded-3xl bg-night p-5 text-white">
                <p className="text-xs uppercase tracking-[0.3em] text-white/70">Live classes today</p>
                <h2 className="mt-3 font-display text-3xl">8 sessions</h2>
                <p className="mt-2 text-sm text-white/70">Member login, QR check-in, and attendance tracking.</p>
                <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <p className="text-white/70">Active play</p>
                    <p className="text-lg font-semibold">10:00</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <p className="text-white/70">Ballet</p>
                    <p className="text-lg font-semibold">11:30</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <p className="text-white/70">Combat</p>
                    <p className="text-lg font-semibold">2:00</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <p className="text-white/70">Fitness</p>
                    <p className="text-lg font-semibold">4:00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="page-shell">
          <SectionTitle
            kicker="Programs"
            title="Classes crafted for every stage"
            subtitle="Mix movement, music, and mindful coaching for total-body growth."
          />
          <div className="grid gap-6 md:grid-cols-3">
            {classHighlights.map((item) => (
              <ClassCard key={item.title} item={item} />
            ))}
          </div>
        </section>

        <section className="page-shell">
          <div className="section-soft rounded-[32px] p-8">
            <SectionTitle
              kicker="Pricing"
              title="Simple plans that fit your family"
              subtitle="Transparent packages with flexible scheduling and membership perks."
            />
            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <PricingCard key={plan.name} plan={plan} />
              ))}
            </div>
          </div>
        </section>

        <section className="page-shell pb-12">
          <div className="rounded-[32px] bg-white/90 p-8 shadow-glow md:flex md:items-center md:justify-between">
            <div>
              <h3 className="font-display text-2xl text-ink">Ready for a complimentary class?</h3>
              <p className="mt-2 text-sm text-ink/70">
                Book a trial session and our team will confirm your slot by SMS.
              </p>
            </div>
            <Link to="/book-trial" className="mt-4 inline-flex rounded-full bg-coral px-6 py-3 text-sm font-semibold text-white md:mt-0">
              Book a trial
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
