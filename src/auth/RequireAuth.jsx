import { Navigate } from 'react-router';
import { useAuth } from './AuthContext.js';

export default function RequireAuth({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}
