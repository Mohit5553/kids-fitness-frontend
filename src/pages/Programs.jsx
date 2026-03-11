import { useEffect, useState } from 'react';
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

<<<<<<< HEAD
  const fetchClasses = () => {
=======
  useEffect(() => {
>>>>>>> 5ba2eb2c538f7bb373cc2fcea42d65cc791058de
    api
      .get('/classes')
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setClasses(res.data);
        }
      })
<<<<<<< HEAD
      .catch(() => { });
  };

  useEffect(() => {
    fetchClasses();
    const handleChange = () => fetchClasses();
    window.addEventListener('location-change', handleChange);
    return () => window.removeEventListener('location-change', handleChange);
=======
      .catch(() => {});
>>>>>>> 5ba2eb2c538f7bb373cc2fcea42d65cc791058de
  }, []);

  return (
    <div>
      <Navbar />
      <main className="page-shell py-12">
        <SectionTitle
          kicker="Programs"
          title="Choose a class path"
          subtitle="Browse our core classes and build a schedule that fits your child."
        />
        <div className="mb-6">
          <LocationPicker compact />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {classes.map((item) => (
            <ClassCard key={item._id || item.title} item={item} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
