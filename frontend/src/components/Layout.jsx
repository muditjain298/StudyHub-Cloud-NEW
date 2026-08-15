import { Outlet, Navigate, Link, useNavigate } from 'react-router-dom'; // useNavigate add kiya
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../features/auth/authSlice';
import { Book, Video, FileText, BarChart2, Presentation, LogOut, Settings } from 'lucide-react';
import { account } from '../lib/appwrite'; // Appwrite account import kiya

function Layout() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Hook initialize kiya

  // onLogout ko async function banaya
  const onLogout = async () => {
    try {
      // 1. Appwrite se current session delete karo
      await account.deleteSession('current');
      
      // 2. Redux state clear karo
      dispatch(logout());
      dispatch(reset());
      
      // 3. Wapas Login page par bhej do
      navigate('/login');
    } catch (error) {
      console.error("Logout mein error aaya:", error);
    }
  };

  // ... baaki ka poora return statement waisa hi rahega jaisa tumne bheja hai

  // LOOP WALA CODE HATA DIYA HAI (if (!user) return <Navigate... />)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="hidden w-64 flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 md:flex">
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200 dark:border-gray-700">
          <Book className="h-8 w-auto text-indigo-600 dark:text-indigo-400" />
          <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">StudyHub</span>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto">
          <nav className="flex-1 space-y-1 px-4 py-4">
            <Link to="/notes" className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700">
              <Book className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
              Notes
            </Link>
            <Link to="/videos" className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
              <Video className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
              Video Links
            </Link>
            <Link to="/questions" className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
              <FileText className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
              Question Banks
            </Link>
            <Link to="/reports" className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
              <BarChart2 className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
              Reports
            </Link>
            <Link to="/ppts" className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
              <Presentation className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
              PPTs
            </Link>
          </nav>
        </div>
        <div className="flex flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="group block w-full flex-shrink-0">
            <div className="flex items-center">
              <div>
                <div className="inline-block h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-bold uppercase">
                  {/* SAFE RENDER */}
                  {user?.name?.charAt(0) || 'U'}
                </div>
              </div>
              <div className="ml-3">
                {/* SAFE RENDER */}
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name || 'User'}</p>
                <button onClick={onLogout} className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 flex items-center mt-1">
                  <LogOut className="w-3 h-3 mr-1" /> Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
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