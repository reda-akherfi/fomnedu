import { useNavigate } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';
import useAuthStore from '../stores/useAuthStore';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  const { username, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <header className="app-header">
      <div className="left-section">
        <button onClick={toggleSidebar} className="hamburger-button">
          <FaBars />
        </button>
        <div className="header-logo">
          <img src="/logo-transparent.png" alt="Logo" className="logo-image" />
          <div className="app-title">OmnEdu</div>
        </div>
      </div>
      
      <div className="user-section">
        <span className="username">{username}</span>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header; 