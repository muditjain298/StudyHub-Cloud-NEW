import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import SectionView from './pages/SectionView';
import ResetPassword from './pages/ResetPassword';
import SharedView from './pages/SharedView';
import { account } from './lib/appwrite';
import { setUser, clearUser } from './features/auth/authSlice';

function App() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const dispatch = useDispatch();

    useEffect(() => {
    const checkUserSession = async () => {
      try {
        const currentAccount = await account.get();
        console.log('[App] account.get() =>', currentAccount);
        dispatch(setUser(currentAccount));
        setIsAuthenticated(true);
      } catch (error) {
        console.log('[App] no session:', error?.message);
        dispatch(clearUser());
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkUserSession();
  }, [dispatch]);


  if (isCheckingAuth) {
    return <div className="flex h-screen items-center justify-center">Loading StudyHub...</div>;
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '12px', background: '#1f2937', color: '#f9fafb', fontSize: '14px' },
          success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
        }}
      />
      <Router>
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/resetpassword/:token" element={<ResetPassword />} />
          <Route path="/share/:token" element={<SharedView />} />

          <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}>
            <Route index element={<Dashboard />} />
            <Route path="notes" element={<SectionView sectionName="Notes" />} />
            <Route path="videos" element={<SectionView sectionName="Video Links" />} />
            <Route path="questions" element={<SectionView sectionName="Question Banks" />} />
            <Route path="reports" element={<SectionView sectionName="Reports" />} />
            <Route path="ppts" element={<SectionView sectionName="PPTs" />} />
          </Route>

          <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;