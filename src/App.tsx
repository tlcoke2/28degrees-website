import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import Home from './pages/Home';
import Tours from './pages/Tours';
import Bookings from './pages/Bookings';
import About from './pages/About';
import Contact from './pages/Contact';
import Admin from './pages/Admin';

const App = () => (
  <AppLayout>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/tours" element={<Tours />} />
      <Route path="/bookings" element={<Bookings />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  </AppLayout>
);

export default App;
