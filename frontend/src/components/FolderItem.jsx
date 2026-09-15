import { Folder as FolderIcon, Trash2, Share2, Star } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { removeFolder, toggleFolderStar } from '../features/files/fileSlice';
import { useState } from 'react';
import ShareModal from './ShareModal';
import toast from 'react-hot-toast';

function FolderItem({ folder, onClick }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [showShare, setShowShare] = useState(false);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Delete this folder and all its contents?')) {
      // Appwrite ki id "$id" hoti hai, "_id" nahi (wo Mongo/Mongoose convention tha)
      dispatch(removeFolder(folder.$id))
        .unwrap()
        .then(() => toast.success('Folder deleted'))
        .catch((err) => toast.error(err || 'Failed to delete folder'));
    }
  };

  const handleToggleStar = (e) => {
    e.stopPropagation();
    dispatch(toggleFolderStar({ id: folder.$id, isStarred: !folder.isStarred }))
      .unwrap()
      .catch(() => toast.error('Failed to update star'));
  };

  return (
    <>
      <div
        onClick={() => onClick(folder)}
        className="group relative flex cursor-pointer items-center space-x-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-4 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 transition-all hover:shadow-md"
      >
        <div className="flex-shrink-0 p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
          <FolderIcon className="h-7 w-7 text-indigo-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{folder.name}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{folder.section}</p>
        </div>
        <div className="flex-shrink-0 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); setShowShare(true); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleToggleStar}
            aria-label={folder.isStarred ? 'Remove star from folder' : 'Star folder'}
            title={folder.isStarred ? 'Remove star' : 'Star folder'}
            className={`p-1.5 rounded-lg transition-colors ${folder.isStarred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'}`}
          >
            <Star className="h-4 w-4" fill={folder.isStarred ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showShare && (
        <ShareModal
          shareType="folder"
          folderId={folder.$id}
          token={user?.token}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  );
}

export default FolderItem;