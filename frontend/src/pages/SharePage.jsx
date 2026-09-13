import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { databases, appwriteConfig } from '../lib/appwrite';
import { Lock, Loader2, AlertCircle } from 'lucide-react';

function SharePage() {
  const { shareId } = useParams();
  const [shareDoc, setShareDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const fetchShare = async () => {
      try {
        const doc = await databases.getDocument(
          appwriteConfig.databaseId,
          appwriteConfig.sharesCollectionId,
          shareId
        );

        // Expiry check
        if (doc.expiresAt && new Date(doc.expiresAt) < new Date()) {
          setError('This link has expired.');
          setLoading(false);
          return;
        }

        setShareDoc(doc);
        if (!doc.password) setUnlocked(true);
      } catch (err) {
        setError('This link is invalid or no longer exists.');
      } finally {
        setLoading(false);
      }
    };
    fetchShare();
  }, [shareId]);

  const handleUnlock = (e) => {
    e.preventDefault();
    if (passwordInput === shareDoc.password) {
      setUnlocked(true);
    } else {
      setError('Incorrect password.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error && !shareDoc) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2 text-gray-600 dark:text-gray-300">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <p>{error}</p>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <form onSubmit={handleUnlock} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-sm space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Password Protected</h2>
          </div>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Enter password"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium">
            Unlock
          </button>
        </form>
      </div>
    );
  }

  // Unlocked — ab actual shared content dikhao
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
        <h1 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 capitalize">
          Shared {shareDoc.shareType}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Content loading logic yaha add karna hai (fileId/folderId se actual file/folder fetch karo).
        </p>
      </div>
    </div>
  );
}

export default SharePage;