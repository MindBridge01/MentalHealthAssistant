// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/NavBar/NavBar.jsx';
import Footer from './components/Footer/Footer.jsx';
import Home from './pages/Home';
import Aichat from './pages/Aichat';
import Community from './pages/Community';

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ai-chat" element={<Aichat />} />
          <Route path="/community" element={<Community />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;