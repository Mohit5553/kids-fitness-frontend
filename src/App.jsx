import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Programs from './pages/Programs.jsx';
import Pricing from './pages/Pricing.jsx';
import Schedule from './pages/Schedule.jsx';
import Gallery from './pages/Gallery.jsx';
import Contact from './pages/Contact.jsx';
import BookTrial from './pages/BookTrial.jsx';
import QuickCheckin from './pages/QuickCheckin.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Calendar from './pages/Calendar.jsx';
import { RequireAuth, RequireAdmin } from './components/ProtectedRoutes.jsx';

import ParentDashboard from './pages/parent/ParentDashboard.jsx';
import MyChildren from './pages/parent/MyChildren.jsx';
import BookClasses from './pages/parent/BookClasses.jsx';
import PaymentHistory from './pages/parent/PaymentHistory.jsx';
import Membership from './pages/parent/Membership.jsx';
import Attendance from './pages/parent/Attendance.jsx';
import MyBookings from './pages/parent/MyBookings.jsx';

import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ClassesManagement from './pages/admin/ClassesManagement.jsx';
import PricingManagement from './pages/admin/PricingManagement.jsx';
import BookingManagement from './pages/admin/BookingManagement.jsx';
import UsersManagement from './pages/admin/UsersManagement.jsx';
import Reports from './pages/admin/Reports.jsx';
import TrainersManagement from './pages/admin/TrainersManagement.jsx';
import AttendanceManagement from './pages/admin/AttendanceManagement.jsx';
import MembershipManagement from './pages/admin/MembershipManagement.jsx';
import SessionsManagement from './pages/admin/SessionsManagement.jsx';
import TrialsManagement from './pages/admin/TrialsManagement.jsx';
import PaymentsManagement from './pages/admin/PaymentsManagement.jsx';
import LocationManagement from './pages/admin/LocationManagement.jsx';
import ActivitiesManagement from './pages/admin/ActivitiesManagement.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/programs" element={<Programs />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/schedule" element={<Schedule />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/book-trial" element={<BookTrial />} />
      <Route path="/quick-checkin" element={<QuickCheckin />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/calendar" element={<Calendar />} />

      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<ParentDashboard />} />
        <Route path="/dashboard/children" element={<MyChildren />} />
        <Route path="/dashboard/book" element={<BookClasses />} />
        <Route path="/dashboard/bookings" element={<MyBookings />} />
        <Route path="/dashboard/payments" element={<PaymentHistory />} />
        <Route path="/dashboard/membership" element={<Membership />} />
        <Route path="/dashboard/attendance" element={<Attendance />} />
        <Route path="/calendar" element={<Calendar />} />
      </Route>

      <Route element={<RequireAdmin />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/classes" element={<ClassesManagement />} />
        <Route path="/admin/sessions" element={<SessionsManagement />} />
        <Route path="/admin/pricing" element={<PricingManagement />} />
        <Route path="/admin/bookings" element={<BookingManagement />} />
        <Route path="/admin/users" element={<UsersManagement />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/admin/trainers" element={<TrainersManagement />} />
        <Route path="/admin/attendance" element={<AttendanceManagement />} />
        <Route path="/admin/memberships" element={<MembershipManagement />} />
        <Route path="/admin/trials" element={<TrialsManagement />} />
        <Route path="/admin/payments" element={<PaymentsManagement />} />
        <Route path="/admin/locations" element={<LocationManagement />} />
        <Route path="/admin/activities" element={<ActivitiesManagement />} />
      </Route>
    </Routes>
  );
}
