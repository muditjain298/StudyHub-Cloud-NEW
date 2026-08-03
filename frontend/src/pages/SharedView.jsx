import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, File as FileIcon, Folder, Lock, Loader2, ExternalLink } from 'lucide-react';

function SharedView() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [checking, setChecking] = useState(false);

  const fetchShare = async (pwd = null) => {
    setChecking(true);
    try {
      const res = await axios.post(`/api/shares/${token}/access`, {
        password: pwd || undefined,
      });
      setData(res.data);
      console.log("API Response:", res.data);
      setRequiresPassword(false);
      setError('');
    } catch (err) {
      if (err.response?.data?.requiresPassword) {
        setRequiresPassword(true);
      } else {
        setError(err.response?.data?.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => { fetchShare(); }, [token]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
    </div>
  );

  if (requiresPassword) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Password Protected</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Enter the password to access this content.</p>
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        <form onSubmit={(e) => { e.preventDefault(); fetchShare(password); }} className="space-y-4">
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button type="submit" disabled={checking}
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition disabled:opacity-50">
            {checking && <Loader2 className="w-4 h-4 animate-spin" />} Unlock
          </button>
        </form>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <p className="text-xl font-bold text-red-500 mb-2">Access Denied</p>
        <p className="text-gray-500 dark:text-gray-400">{error}</p>
        <Link to="/" className="mt-4 inline-block text-indigo-600 hover:underline">Go to StudyHub</Link>
      </div>
    </div>
  );

  const allFiles = data?.files || (data?.file ? [data.file] : []);
  const allFolders = data?.folders || data?.subFolders || (data?.folder ? [data.folder] : []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">StudyHub</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 dark:text-gray-500">Shared content</p>
            {data?.expiresAt && (
              <p className="text-xs text-orange-500">Expires: {new Date(data.expiresAt).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
            Shared {data?.shareType}: {data?.section || data?.folder?.name || data?.file?.name || ''}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {data?.viewCount} {data?.viewCount === 1 ? 'view' : 'views'}
          </p>
        </div>

        {/* Folders */}
        {allFolders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Folders</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {allFolders.map((f) => (
  <div
    key={f._id}
    onClick={() => alert(f.name)}
    className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg cursor-pointer"
  >
                  <Folder className="w-6 h-6 text-indigo-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{f.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Files */}
        {allFiles.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Files</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {allFiles.map((f) => (
                <a key={f._id} href={f.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="group flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-indigo-400 transition-colors">
                  {f.thumbnail
                    ? <img src={f.thumbnail} alt={f.name} className="w-12 h-10 object-cover rounded-md flex-shrink-0" />
                    : <div className="w-12 h-10 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center flex-shrink-0">
                        <FileIcon className="w-5 h-5 text-gray-400" />
                      </div>
                  }
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{f.name}</p>
                    {f.difficulty && <span className="text-xs text-gray-500">{f.difficulty}</span>}
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 flex-shrink-0 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        )}

        {allFiles.length === 0 && allFolders.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400">This shared space is empty.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default SharedView;
