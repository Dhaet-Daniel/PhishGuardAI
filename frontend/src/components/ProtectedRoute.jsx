import { Navigate } from 'react-router-dom';
import { jwtDecode as jwt_decode } from 'jwt-decode';

export default function ProtectedRoute({ children, roleRequired }) {
  const token = localStorage.getItem('authToken');
  if (!token) return <Navigate to="/" replace />;

  let decoded;
  try {
    decoded = jwt_decode(token);
  } catch {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    return <Navigate to="/" replace />;
  }

  if (roleRequired && decoded.role !== roleRequired) {
    return decoded.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/scanner" />;
  }

  return children;
}
