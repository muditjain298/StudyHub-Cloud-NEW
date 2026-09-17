import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { databases, appwriteConfig } from '../lib/appwrite';
import { Query } from 'appwrite';
import { Lock, Loader2, AlertCircle, Download, File as FileIcon, Folder } from 'lucide-react';

// File URL banne ke liye storage se generate karna padta hai
const getFileUrl = (fileId) => {
  if (!fileId) {
    console.warn('[share] fileId missing');
    return null;
  }
  if (!appwriteConfig.bucketId) {
    console.error('[share] bucketId undefined in appwriteConfig', appwriteConfig);
    return null;
  }
  const url = `https://sgp.cloud.appwrite.io/v1/storage/buckets/${appwriteConfig.bucketId}/files/${fileId}/view`;
  console.log('[share] generated url =>', url);
  return url;
};

const toDownloadUrl = (url) => (url ? url.replace('/view', '/download') : '');

const extOf = (name = '') => name.split('.').pop()?.toLowerCase() || '';
const isImage = (n) => ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extOf(n));
const isPdf = (n) => extOf(n) === 'pdf';

function SharePage() {
  const { shareId } = useParams();
  const [shareDoc, setShareDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [unlocked, setUnlocked] = useState(false);

  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [active, setActive] = useState(null); // preview ke liye selected note

  // Share document fetch karna
  useEffect(() => {
    (async () => {
      try {
        const doc = await databases.getDocument(
          appwriteConfig.databaseId,
          appwriteConfig.sharesCollectionId,
          shareId
        );
        if (doc.expiresAt && new Date(doc.expiresAt) < new Date()) {
          setError('This link has expired.');
          return;
        }
        setShareDoc(doc);
        if (!doc.password) setUnlocked(true);
      } catch (err) {
        console.error('[share] fetch failed =>', err);
        setError('This link is invalid or no longer exists.');
      } finally {
        setLoading(false);
      }
    })();
  }, [shareId]);

  // Actual file/folder content load karna
  const loadContent = useCallback(async () => {
    if (!shareDoc) return;
    setContentLoading(true);
    try {
      const db = appwriteConfig.databaseId;
      const notesCol = appwriteConfig.notesCollectionId;
      const foldersCol = appwriteConfig.folderCollectionId;

      if (shareDoc.shareType === 'file' && shareDoc.fileId) {
        // Single file/note
        const note = await databases.getDocument(db, notesCol, shareDoc.fileId);
        setNotes([note]);
        setActive(note);
      } else if (shareDoc.shareType === 'folder' && shareDoc.folderId) {
        // Folder ke andar saare notes + subfolders
        const [notesList, foldersList] = await Promise.all([
          databases.listDocuments(db, notesCol, [Query.equal('folderId', shareDoc.folderId)]),
          databases.listDocuments(db, foldersCol, [Query.equal('parent', shareDoc.folderId)]),
        ]);
        setNotes(notesList.documents);
        setFolders(foldersList.documents);
      } else if (shareDoc.section) {
        // Section (e.g., "DSA") ke saare notes
        const notesList = await databases.listDocuments(db, notesCol, [
          Query.equal('section', shareDoc.section),
        ]);
        setNotes(notesList.documents);
      }
    } catch (err) {
      console.error('[share] content load failed =>', err);
      setError(err?.message || 'Could not load shared content.');
    } finally {
      setContentLoading(false);
    }
  }, [shareDoc]);

  useEffect(() => {
    if (unlocked && shareDoc) loadContent();
  }, [unlocked, shareDoc, loadContent]);

  const handleUnlock = (e) => {
    e.preventDefault();
    if (passwordInput === shareDoc.password) {
      setError('');
      setUnlocked(true);
    } else {
      setError('Incorrect password.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error && !shareDoc) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <p className="text-center">{error}</p>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <form
          onSubmit={handleUnlock}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-sm space-y-4"
        >
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
          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium"
          >
            Unlock
          </button>
        </form>
      </div>
    );
  }

  // Unlocked state — content display
const fileUrl = active?.fileUrl || (active?.fileId ? getFileUrl(active.fileId) : null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-semibold text-2xl text-gray-900 dark:text-white capitalize">
            Shared {shareDoc.shareType}
          </h1>
          {shareDoc.expiresAt && (
            <p className="text-xs text-orange-500 mt-1">
              Expires: {new Date(shareDoc.expiresAt).toLocaleString()}
            </p>
          )}
        </div>

        {contentLoading && (
          <div className="flex items-center gap-2 text-indigo-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p className="text-sm">Loading content...</p>
          </div>
        )}
        {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</p>}

        {/* File Preview */}
        {fileUrl && active && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{active.title || 'Untitled'}</p>
                {active.section && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{active.section}</p>
                )}
              </div>
              <a
                href={toDownloadUrl(fileUrl)}
                download
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" /> Download
              </a>
            </div>

            {isImage(active.title) ? (
              <img
                src={active.fileUrl || fileUrl}
                alt={active.title}
                className="max-h-[60vh] w-full object-contain rounded-xl"
                onError={(event) => {
                  console.error('[share] image load failed', event);
                  setError('Failed to load image');
                }}
              />
            ) : isPdf(active.title) ? (
              <iframe
                src={active.fileUrl || fileUrl}
                title={active.title}
                className="w-full h-[60vh] rounded-xl border-0"
                onError={(event) => {
                  console.error('[share] pdf load failed', event);
                  setError('Failed to load PDF');
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-40 bg-gray-100 dark:bg-gray-700 rounded-xl">
                <FileIcon className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-300">Preview not available</p>
                <a href={active.fileUrl || fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-sm mt-2">
                  Open in new tab
                </a>
              </div>
            )}
          </div>
        )}

        {/* Subfolders */}
        {folders.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Folders</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {folders.map((fd) => (
                <div
                  key={fd.$id}
                  className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-indigo-400 transition-colors"
                >
                  <Folder className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                  <span className="text-sm text-gray-900 dark:text-white truncate">{fd.name || 'Untitled'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes/Files List */}
        {notes.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {notes.length > 1 ? 'Files' : 'File'}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {notes.map((note) => (
                <div
                  key={note.$id}
                  className={`bg-white dark:bg-gray-800 rounded-xl p-4 border transition-all cursor-pointer ${
                    active?.$id === note.$id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                  }`}
                >
                  <button
                    onClick={() => setActive(note)}
                    className="flex items-center gap-3 w-full text-left mb-3"
                  >
                    <FileIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {note.title || 'Untitled'}
                      </p>
                      {note.difficulty && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{note.difficulty}</p>
                      )}
                    </div>
                  </button>
                  {note.fileUrl ? (
                    <a
                      href={toDownloadUrl(note.fileUrl)}
                      download
                      className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  ) : note.fileId ? (
                    <a
                      href={toDownloadUrl(getFileUrl(note.fileId))}
                      download
                      className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  ) : (
                    <p className="text-xs text-gray-400">No file attached</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!contentLoading && notes.length === 0 && folders.length === 0 && !error && (
          <div className="text-center py-12">
            <FileIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500">This shared space is empty.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SharePage;
