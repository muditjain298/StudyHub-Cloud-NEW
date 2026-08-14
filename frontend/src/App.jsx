import { BrowserRouter as Router, Routes, Route,Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import SectionView from './pages/SectionView';
import ResetPassword from './pages/ResetPassword';
import SharedView from './pages/SharedView';
import { useEffect, useState } from 'react';
import { account } from './lib/appwrite'; 

function App() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const currentAccount = await account.get();
        if (currentAccount) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkUserSession();
  }, []);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <h2 className="text-xl font-bold text-indigo-600">Loading StudyHub...</h2>
      </div>
    );
  }

return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            background: '#1f2937',
            color: '#f9fafb',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
        }}
      />
      <Router>
        <Routes>
          {/* Agar login hai, toh wapas Home (/) par bhej do */}
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/resetpassword/:token" element={<ResetPassword />} />
          <Route path="/share/:token" element={<SharedView />} />
          
          {/* Main Layout ko bhi protect kar diya: Agar login nahi hai, toh Login page par bhej do */}
          <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<Dashboard />} />
            <Route path="notes" element={<SectionView sectionName="Notes" />} />
            <Route path="videos" element={<SectionView sectionName="Video Links" />} />
            <Route path="questions" element={<SectionView sectionName="Question Banks" />} />
            <Route path="reports" element={<SectionView sectionName="Reports" />} />
            <Route path="ppts" element={<SectionView sectionName="PPTs" />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;