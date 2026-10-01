import { useAuth } from '../contexts/AuthContext';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 2rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: '32px', height: '32px', background: 'var(--accent-gradient)', borderRadius: '8px' }}></div>
        <h2 className="text-gradient" style={{ margin: 0 }}>KhaataAI</h2>
      </div>
      
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <User size={18} />
            <span>{user.full_name}</span>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
