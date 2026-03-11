import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import SectionTitle from '../components/SectionTitle.jsx';
import aboutImage from '../assets/about-movement.svg';

export default function About() {
  return (
    <div>
      <Navbar />
      <main className="page-shell py-12">
        <SectionTitle
          kicker="Our story"
          title="Movement-first childhoods"
          subtitle="We blend playful coaching with safe progress tracking for every family."
        />
        <div className="grid gap-8 md:grid-cols-2">
          <div className="soft-card rounded-3xl p-6">
            <h3 className="font-display text-xl">What we believe</h3>
            <p className="mt-3 text-sm text-ink/70">
              Kids thrive when movement is joyful and structured. Our sessions focus on coordination,
              balance, and confidence while parents stay in the loop.
            </p>
          </div>
          <div className="soft-card rounded-3xl p-6">
            <h3 className="font-display text-xl">How we coach</h3>
            <p className="mt-3 text-sm text-ink/70">
              Certified trainers guide small groups with clear milestones. Every class ends with a quick
              progress note in the parent dashboard.
            </p>
          </div>
          <div className="soft-card rounded-3xl p-6 md:col-span-2">
            <img src={aboutImage} alt="Movement class" className="w-full rounded-3xl" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
