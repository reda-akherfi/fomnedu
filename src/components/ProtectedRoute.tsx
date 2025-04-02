import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';
import { authService } from '../services/authService';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { token, isAuthenticated, logout } = useAuthStore();
  const [verifying, setVerifying] = useState(true);
  
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const isValid = await authService.verifyToken(token);
          if (!isValid) {
            logout();
          }
        } catch (error) {
          logout();
        }
      }
      setVerifying(false);
    };
    
    verifyToken();
  }, [token, logout]);
  
  if (verifying) {
    return <div className="loading-screen">Verifying authentication...</div>;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" />;
};

export default ProtectedRoute; 