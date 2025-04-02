import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';

const Header = () => {
  const { username, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="app-title">OmnEdu</div>
        <div className="user-section">
          <span className="username">{username}</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header; 