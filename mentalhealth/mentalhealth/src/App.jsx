// src/App.jsx
import { Routes, Route, useLocation } from 'react-router-dom';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
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

function App() {
  const location = useLocation();
  // Load user from localStorage
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  return (
    <div className="flex flex-col min-h-screen">
      {!['/ai-chat', '/questions', '/play-games'].includes(location.pathname) && <Navbar user={user} />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ai-chat" element={<Aichat />} />
          <Route path="/community" element={<Community />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/play-games" element={<PlayGames />} />
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/profile-settings" element={<ProfileSettings user={user} />} />
          <Route path="/doctor-only-dashboard" element={<DoctorOnlyDashboard />} />

          {/* Login */}
          <Route path="/login/user" element={<AuthWindow mode="login" role="user" onSwitch={() => { }} />} />
          <Route path="/login/doctor" element={<AuthWindow mode="login" role="doctor" onSwitch={() => { }} />} />
          <Route path="/login/admin" element={<AuthWindow mode="login" role="admin" onSwitch={() => { }} />} />

          {/* Signup */}
          <Route path="/signup/user" element={<AuthWindow mode="signup" role="user" onSwitch={() => { }} />} />
          <Route path="/signup/doctor" element={<AuthWindow mode="signup" role="doctor" onSwitch={() => { }} />} />
          <Route path="/signup/admin" element={<AuthWindow mode="signup" role="admin" onSwitch={() => { }} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;