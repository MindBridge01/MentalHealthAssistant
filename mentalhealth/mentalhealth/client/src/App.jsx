// src/App.jsx
import { Routes, Route, useLocation } from 'react-router-dom';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PatientDashboard from './pages/PatientDashboard';
import PatientBooking from './pages/PatientBooking';
import ProfileSettings from './pages/ProfileSettings';
import AuthWindow from './components/AuthWindow';
import Navbar from './components/NavBar/NavBar.jsx';
import Footer from './components/Footer/Footer.jsx';
import Home from './pages/Home';
import Aichat from './pages/Aichat';
import Community from './pages/Community';
import DoctorOnlyDashboard from './pages/DoctorOnlyDashboard';
import Questions from './pages/Questions';
import PlayGames from './pages/PlayGames';
import StressCatch from './games/StressCatch';
import FruitMatch from './games/FruitMatch';
import PatientProfile from './pages/PatientProfile';
import Counseling from './pages/Counseling';
import ProtectedRoute from './components/ProtectedRoute';
import Unauthorized from './pages/Unauthorized';
import { useAuth } from './context/AuthContext';

function App() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {!['/ai-chat', '/questions', '/play-games', '/stress-catch', '/fruit-match', '/counseling'].includes(location.pathname) && <Navbar user={user} />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/ai-chat"
            element={
              <ProtectedRoute allowedRoles={['patient', 'pending-doctor']}>
                <Aichat />
              </ProtectedRoute>
            }
          />
          <Route path="/community" element={<Community />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/counseling" element={<Counseling />} />
          <Route path="/play-games" element={<PlayGames />} />
          <Route path="/stress-catch" element={<StressCatch />} />
          <Route path="/fruit-match" element={<FruitMatch />} />
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute allowedRoles={['patient', 'pending-doctor']}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute role="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor-dashboard"
            element={
              <ProtectedRoute allowedRoles={['patient', 'pending-doctor']}>
                <PatientBooking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile-settings"
            element={
              <ProtectedRoute allowedRoles={['patient', 'pending-doctor']}>
                <ProfileSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor-only-dashboard"
            element={
              <ProtectedRoute role="doctor">
                <DoctorOnlyDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/patient-profile/:id" element={<PatientProfile />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Login */}
          <Route path="/login" element={<AuthWindow mode="login" />} />
          <Route path="/login/:role" element={<AuthWindow mode="login" />} />

          {/* Signup */}
          <Route path="/signup" element={<AuthWindow mode="signup" />} />
          <Route path="/signup/:role" element={<AuthWindow mode="signup" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
