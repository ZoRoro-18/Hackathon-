import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div style={{ minHeight: '100vh', padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
      <Navbar />
      <main className="animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
