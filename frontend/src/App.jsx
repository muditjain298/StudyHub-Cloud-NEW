import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { Toaster } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import SectionView from './pages/SectionView';
import UsageGuide from './components/UsageGuide';

import PremiumDashboard from './pages/PremiumDashboard';
import AdminPanel from './pages/AdminPanel';

import PremiumRoute from './components/PremiumRoute';
import AdminRoute from './components/AdminRoute';

import SharePage from './pages/SharePage';

import { account } from './lib/appwrite';
import {
  setUser,
  clearUser,
} from './features/auth/authSlice';

import authService from './features/auth/authService';

function App() {
  const [isCheckingAuth, setIsCheckingAuth] =
    useState(true);

  const [isAuthenticated, setIsAuthenticated] =
    useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const currentAccount =
          await account.get();

        console.log(
          '[App] account.get() =>',
          currentAccount
        );

        dispatch(
          setUser(
            await authService.ensureProfile(
              currentAccount
            )
          )
        );

        setIsAuthenticated(true);
      } catch (error) {
        console.log(
          '[App] no session:',
          error?.message
        );

        dispatch(clearUser());
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkUserSession();
  }, [dispatch]);

  if (isCheckingAuth) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading notezyy...
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
          success: {
            iconTheme: {
              primary: '#6366f1',
              secondary: '#fff',
            },
          },
        }}
      />

      <Router>
        <Routes>

          {/* Login */}
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate
                  to="/"
                  replace
                />
              ) : (
                <Login />
              )
            }
          />

          {/* Register */}
          <Route
            path="/register"
            element={<Register />}
          />

          {/* Forgot Password */}
          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          {/* Appwrite Password Recovery */}
          <Route
            path="/resetpassword"
            element={<ResetPassword />}
          />

          {/* Share Page */}
          <Route
            path="/share/:shareId"
            element={<SharePage />}
          />

          {/* Protected App */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Layout />
              ) : (
                <Navigate
                  to="/login"
                  replace
                />
              )
            }
          >
            <Route
              index
              element={<Dashboard />}
            />

            <Route
              path="notes"
              element={
                <SectionView
                  key="notes"
                  sectionName="Notes"
                />
              }
            />

            <Route
              path="videos"
              element={
                <SectionView
                  key="videos"
                  sectionName="Video Links"
                />
              }
            />

            <Route
              path="questions"
              element={
                <SectionView
                  key="questions"
                  sectionName="Question Banks"
                />
              }
            />

            <Route
              path="reports"
              element={
                <SectionView
                  key="reports"
                  sectionName="Reports"
                />
              }
            />

            <Route
              path="ppts"
              element={
                <SectionView
                  key="ppts"
                  sectionName="PPTs"
                />
              }
            />

            <Route
              path="about"
              element={<UsageGuide />}
            />

            <Route
              path="premium"
              element={
                <PremiumRoute>
                  <PremiumDashboard />
                </PremiumRoute>
              }
            />

            <Route
              path="admin"
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route
            path="*"
            element={
              <Navigate
                to={
                  isAuthenticated
                    ? '/'
                    : '/login'
                }
                replace
              />
            }
          />

        </Routes>
      </Router>
    </>
  );
}

export default App;