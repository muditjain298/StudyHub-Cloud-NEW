import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.prefs?.role === 'admin';

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
      <p className="mt-4 text-gray-600 dark:text-gray-300">
        Welcome back, {user?.name}! Here are your study materials.
      </p>
      
      {!user?.prefs?.isPremium && !isAdmin && (
        <Link to="/premium" className="mt-8 block overflow-hidden rounded-xl border border-purple-800/50 bg-gradient-to-r from-purple-950 to-gray-900 p-6 text-white shadow-lg transition hover:border-purple-500">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-300">StudyHub Premium</p>
              <h2 className="mt-2 text-xl font-semibold">Unlock curated notes, videos, PPTs, reports, and question banks</h2>
              <p className="mt-2 text-sm text-gray-300">One-time UPI payment. Securely verified access.</p>
            </div>
            <span className="shrink-0 rounded-lg bg-purple-500 px-4 py-2 text-sm font-semibold">View Premium</span>
          </div>
        </Link>
      )}

      {/* Sections Placeholder */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/notes" className="block overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800 p-6 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notes</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Manage your PDF and text notes.</p>
        </Link>
        <Link to="/videos" className="block overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800 p-6 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Video Links</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Saved educational videos.</p>
        </Link>
        <Link to="/questions" className="block overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800 p-6 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Question Banks</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Previous year papers.</p>
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;
