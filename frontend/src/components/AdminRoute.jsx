import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

function AdminRoute({ children }) {
  const { user } = useSelector((state) => state.auth);
  return user?.prefs?.role === 'admin' ? children : <Navigate to="/" replace />;
}

export default AdminRoute;