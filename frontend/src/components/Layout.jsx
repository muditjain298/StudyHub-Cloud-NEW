import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../features/auth/authSlice';
import { Book, Video, FileText, BarChart2, Presentation, LogOut, Crown, Shield, Menu, X, Info, Users } from 'lucide-react';

function Layout() {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.prefs?.role === 'admin';
  const dispatch = useDispatch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const onLogout = async () => {
    try {
      // Redux thunk khud Appwrite session delete karta hai (authService.logout())
      // aur localStorage bhi clear karta hai — isliye yahan alag se
      // account.deleteSession('current') call NAHI karna, warna
      // session do baar delete hone ki koshish hogi (401 error).
      await dispatch(logout()).unwrap();
      dispatch(reset());
    } catch (error) {
      console.error("Logout mein error aaya:", error);
    } finally {
      // Hard redirect — App.jsx ka local isAuthenticated state
      // sirf mount pe set hota hai, navigate() se update nahi hota.
      // Full reload se App.jsx ka auth-check fresh chalega aur
      // sahi se "logged out" state pe le jayega.
      window.location.href = '/login';
    }
  };

  const navLinks = (
    <>
      <Link
        to="/premium"
        onClick={() => setMobileMenuOpen(false)}
        className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-900/30"
      >
        <Crown className="mr-3 h-5 w-5 text-purple-500" /> {user?.prefs?.isPremium || isAdmin ? 'Premium Library' : 'Upgrade Premium'}
      </Link>
      {isAdmin && (
        <Link
          to="/admin"
          onClick={() => setMobileMenuOpen(false)}
          className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <Shield className="mr-3 h-5 w-5 text-indigo-400" /> Admin Panel
        </Link>
      )}
      {isAdmin && (
        <Link
          to="/admin/access"
          onClick={() => setMobileMenuOpen(false)}
          className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <Users className="mr-3 h-5 w-5 text-emerald-400" /> Admin Access
        </Link>
      )}
      <Link
        to="/notes"
        onClick={() => setMobileMenuOpen(false)}
        className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <Book className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
        Notes
      </Link>
      <Link
        to="/videos"
        onClick={() => setMobileMenuOpen(false)}
        className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
      >
        <Video className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
        Video Links
      </Link>
      <Link
        to="/questions"
        onClick={() => setMobileMenuOpen(false)}
        className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
      >
        <FileText className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
        Question Banks
      </Link>
      <Link
        to="/reports"
        onClick={() => setMobileMenuOpen(false)}
        className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
      >
        <BarChart2 className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
        Reports
      </Link>
      <Link
        to="/ppts"
        onClick={() => setMobileMenuOpen(false)}
        className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
      >
        <Presentation className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
        PPTs
      </Link>
      <Link
        to="/about"
        onClick={() => setMobileMenuOpen(false)}
        className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
      >
        <Info className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
        About
      </Link>
    </>
  );

  const userFooter = (
    <div className="flex items-center">
      <div>
        <div className="inline-block h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-bold uppercase">
          {user?.name?.charAt(0) || 'U'}
        </div>
      </div>
      <div className="ml-3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name || 'User'}</p>
        <button onClick={onLogout} className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 flex items-center mt-1">
          <LogOut className="w-3 h-3 mr-1" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <div className="hidden w-64 flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 md:flex">
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200 dark:border-gray-700">
          <Book className="h-8 w-auto text-indigo-600 dark:text-indigo-400" />
          <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">notezyy</span>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto">
          <nav className="flex-1 space-y-1 px-4 py-4">
            {navLinks}
          </nav>
        </div>
        <div className="flex flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="group block w-full flex-shrink-0">
            {userFooter}
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/60 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile slide-in drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Book className="h-8 w-auto text-indigo-600 dark:text-indigo-400" />
            <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">notezyy</span>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
            <X className="h-6 w-6 text-gray-500 dark:text-gray-300" />
          </button>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto">
          <nav className="flex-1 space-y-1 px-4 py-4">
            {navLinks}
          </nav>
        </div>
        <div className="flex flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="group block w-full flex-shrink-0">
            {userFooter}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 md:hidden">
          <button onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
            <Menu className="h-6 w-6 text-gray-700 dark:text-gray-200" />
          </button>
          <div className="flex items-center">
            <Book className="h-6 w-auto text-indigo-600 dark:text-indigo-400" />
            <span className="ml-2 text-lg font-bold text-gray-900 dark:text-white">notezyy</span>
          </div>
          <div className="w-6" />
        </div>

        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 focus:outline-none">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;