import { File as FileIcon, Trash2, Share2, Star } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { removeFile, renameFile, toggleFileStar } from '../features/files/fileSlice';
import { useState } from 'react';
import ShareModal from './ShareModal';
import toast from 'react-hot-toast';
import { appwriteConfig } from '../lib/appwrite';

function FileItem({ file }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const isAdmin =
    user?.$id === appwriteConfig.adminUserId ||
    user?.prefs?.role === 'admin';
  const [showShare, setShowShare] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(file.title || '');

  const handleDelete = (e) => {
    e.stopPropagation();
    if (!isAdmin) {
      toast.error('Only admin can delete files.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this file?')) {
      // FIX: Appwrite documents ki ID `$id` hoti hai, `_id` nahi (MongoDB convention thi)
      dispatch(removeFile(file.$id))
        .unwrap()
        .then(() => toast.success('File deleted'))
        .catch(() => toast.error('Failed to delete file'));
    }
  };

  const handleOpen = () => {
    if (file.fileUrl) window.open(file.fileUrl, '_blank');
  };

  const handleRename = async (value = newTitle) => {
    if (!isAdmin) {
      toast.error('Only admin can rename files.');
      return;
    }
    const title = value.trim();
    setIsRenaming(false);

    if (!title || title === file.title) {
      setNewTitle(file.title || '');
      return;
    }

    try {
      await dispatch(renameFile({ id: file.$id, title })).unwrap();
      toast.success('File renamed');
    } catch (error) {
      setNewTitle(file.title || '');
      toast.error(error || 'Failed to rename file');
    }
  };

  const handleToggleStar = (e) => {
  e.stopPropagation();
  dispatch(toggleFileStar({ id: file.$id, isStarred: !file.isStarred }))
    .unwrap()
    .then((res) => console.log('Star OK:', res))
    .catch((err) => {
      console.error('Star FAILED:', err);
      toast.error(String(err));
    });
};

  return (
    <>
      <div
        onClick={handleOpen}
        className="group relative flex cursor-pointer items-center space-x-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 transition-all hover:shadow-md"
      >
        <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
          {file.thumbnail ? (
            <img src={file.thumbnail} alt={file.title || 'file'} className="h-full w-full object-cover" />
          ) : (
            <FileIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          {/* Defensive fallback: agar title missing ho (purana blank-card bug) to bhi crash na ho */}
          {isRenaming && isAdmin ? (
            <input
              autoFocus
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              onBlur={(event) => handleRename(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.currentTarget.blur();
                if (event.key === 'Escape') {
                  event.currentTarget.value = file.title || '';
                  setNewTitle(file.title || '');
                  setIsRenaming(false);
                }
              }}
              aria-label="Rename file"
              className="w-full rounded border border-indigo-400 bg-white px-1 text-sm font-medium text-gray-900 outline-none dark:bg-gray-800 dark:text-gray-100"
            />
          ) : (
            <p
              onClick={(event) => event.stopPropagation()}
              onDoubleClick={(event) => {
                event.stopPropagation();
                if (!isAdmin) return;
                setNewTitle(file.title || '');
                setIsRenaming(true);
              }}
              title={isAdmin ? 'Double-click to rename' : undefined}
              className="cursor-default truncate text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              {file.title || 'Untitled file'}
            </p>
          )}
          <div className="flex items-center mt-1 space-x-2">
            {file.size > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            )}
            {file.difficulty && (
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                file.difficulty === 'Easy' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                file.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
              }`}>
                {file.difficulty}
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Share: admin only */}
          {isAdmin && (
            <button onClick={(e) => { e.stopPropagation(); setShowShare(true); }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
              <Share2 className="h-4 w-4" />
            </button>
          )}
          {/* Star: everyone */}
          <button onClick={handleToggleStar}
            aria-label={file.isStarred ? 'Remove star from file' : 'Star file'}
            title={file.isStarred ? 'Remove star' : 'Star file'}
            className={`p-1.5 rounded-lg transition-colors ${file.isStarred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'}`}>
            <Star className="h-4 w-4" fill={file.isStarred ? 'currentColor' : 'none'} />
          </button>
          {/* Delete: admin only */}
          {isAdmin && (
            <button onClick={handleDelete}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {showShare && isAdmin && (
        <ShareModal
          shareType="file"
          fileId={file.$id}
          userId={user?.$id}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  );
}

export default FileItem;