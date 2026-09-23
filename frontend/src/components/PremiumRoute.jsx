import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PremiumPaywall from './PremiumPaywall';

function PremiumRoute({ children }) {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.prefs?.role === 'admin';
  if (!user) return <Navigate to="/login" replace />;
  return user?.prefs?.isPremium || isAdmin ? children : <PremiumPaywall />;
}

export default PremiumRoute;