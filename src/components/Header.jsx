import { NavLink, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext.js';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="header">
      <div className="header__inner">
        <span className="header__logo"><span aria-hidden="true">⛅</span> WeatherApp</span>
        <nav className="header__nav">
          <NavLink to="/dashboard">Dashboard</NavLink>
        </nav>
        <span className="header__user">{user}</span>
        <button type="button" className="header__logout" onClick={handleLogout}>Log out</button>
      </div>
    </header>
  );
}
