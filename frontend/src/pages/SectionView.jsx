import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFolders, fetchFiles, createNewFolder, uploadNewFile, uploadNewLink } from '../features/files/fileSlice';
import fileService from '../features/files/fileService';
import FolderItem from '../components/FolderItem';
import FileItem from '../components/FileItem';
import ShareModal from '../components/ShareModal';
import toast from 'react-hot-toast';
import { FolderPlus, UploadCloud, ChevronLeft, Loader2, Link as LinkIcon, Share2, Search } from 'lucide-react';

function SectionView({ sectionName }) {
  const dispatch = useDispatch();
  const { folders, files, isLoading } = useSelector((state) => state.file);
  
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderHistory, setFolderHistory] = useState([]);
  const [showShareSection, setShowShareSection] = useState(false);
  
  // States for Video Links / Question Banks
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isProcessingLink, setIsProcessingLink] = useState(false);
  const [difficulty, setDifficulty] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Appwrite me id $id hoti hai
    dispatch(fetchFolders({ section: sectionName, parentId: currentFolder?.$id }));
    dispatch(fetchFiles({ section: sectionName, folderId: currentFolder?.$id }));
  }, [dispatch, sectionName, currentFolder]);

  const handleCreateFolder = () => {
    const name = window.prompt('Enter folder name:'); 
    if (name && name.trim() !== '') {
      dispatch(createNewFolder({
        name: name.trim(),
        section: sectionName,
        parent: currentFolder?.$id || null // _id ki jagah $id
      })).unwrap()
        .then(() => toast.success('Folder created successfully'))
        .catch((err) => toast.error(err || 'Failed to create folder'));
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('section', sectionName);
      if (currentFolder) {
        formData.append('folder', currentFolder.$id); // _id ki jagah $id
      }
      if (sectionName === 'Question Banks' && difficulty) {
        formData.append('difficulty', difficulty);
      }
      
      const uploadPromise = dispatch(uploadNewFile(formData)).unwrap();
      toast.promise(uploadPromise, {
        loading: 'Uploading file...',
        success: 'File uploaded successfully',
        error: 'Error uploading file'
      });
    }
    e.target.value = null; 
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!linkUrl) return;
    
    setIsProcessingLink(true);
    try {
      // Token hata diya gaya hai kyunki Appwrite khud session handle karta hai
      const metadata = await fileService.fetchMetadata(linkUrl);
      
      const linkData = {
        name: metadata.title || 'Unknown Video',
        fileUrl: linkUrl,
        section: sectionName,
        folder: currentFolder?.$id || null, // _id ki jagah $id
        thumbnail: metadata.thumbnail || '',
        mimeType: 'video/link' 
      };
      
      await dispatch(uploadNewLink(linkData)).unwrap();
      toast.success('Link added successfully');
      setShowLinkModal(false);
      setLinkUrl('');
    } catch {
      toast.error('Failed to process link. Ensure it is a valid YouTube URL.');
    } finally {
      setIsProcessingLink(false);
    }
  };

  const navigateToFolder = (folder) => {
    setFolderHistory([...folderHistory, currentFolder]);
    setCurrentFolder(folder);
  };

  const navigateBack = () => {
    const newHistory = [...folderHistory];
    const previousFolder = newHistory.pop();
    setFolderHistory(newHistory);
    setCurrentFolder(previousFolder);
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleFolders = folders
    .filter((folder) => !normalizedSearch || `${folder.name} ${folder.section}`.toLowerCase().includes(normalizedSearch))
    .sort((first, second) => Number(second.isStarred) - Number(first.isStarred));
  const visibleFiles = files
    .filter((file) => !normalizedSearch || [file.title, file.section, file.difficulty, file.fileUrl]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch))
    .sort((first, second) => Number(second.isStarred) - Number(first.isStarred));
  const hasVisibleItems = visibleFolders.length > 0 || visibleFiles.length > 0;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          {currentFolder && (
            <button onClick={navigateBack} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              <ChevronLeft className="w-5 h-5 dark:text-white" />
            </button>
          )}
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {sectionName} {currentFolder ? `> ${currentFolder.name}` : ''}
          </h1>
        </div>
        
        <div className="flex items-center space-x-3">
          {sectionName === 'Question Banks' && (
            <select 
              value={difficulty} 
              onChange={(e) => setDifficulty(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md shadow-sm text-sm dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">No Difficulty (For Upload)</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          )}
          
          <button 
            onClick={handleCreateFolder}
            className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <FolderPlus className="w-4 h-4 mr-2" /> New Folder
          </button>

          <button
            onClick={() => setShowShareSection(true)}
            className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Share2 className="w-4 h-4 mr-2" /> Share Section
          </button>
          
          {sectionName === 'Video Links' ? (
            <button 
              onClick={() => setShowLinkModal(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700"
            >
              <LinkIcon className="w-4 h-4 mr-2" /> Add Link
            </button>
          ) : (
            <label className="flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 cursor-pointer transition-colors">
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
              Upload File
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notes, links, folders..."
            aria-label="Search notes, links, and folders"
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </label>
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add YouTube Link</h3>
            <form onSubmit={handleAddLink}>
              <input 
                type="url" 
                required
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md mb-4 dark:bg-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isProcessingLink}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isProcessingLink && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading && folders.length === 0 && files.length === 0 ? (
        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
      ) : (
        <div className="space-y-8">
          {/* Folders Section */}
          {visibleFolders.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">Folders</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleFolders.map(folder => (
                  <FolderItem key={folder.$id} folder={folder} onClick={navigateToFolder} /> 
                ))}
              </div>
            </div>
          )}

          {/* Files Section */}
          {visibleFiles.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">Files & Links</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleFiles.map(file => (
                  <FileItem key={file.$id} file={file} />
                ))}
              </div>
            </div>
          )}

          {!hasVisibleItems && (
            <div className="text-center py-20">
              {sectionName === 'Video Links' ? (
                <LinkIcon className="mx-auto h-12 w-12 text-gray-400" />
              ) : (
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
              )}
              <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                {searchTerm ? 'No matching items' : 'No items found'}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Try another search.' : 'Get started by creating a new folder or adding an item.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Section Share Modal */}
      {showShareSection && (
        <ShareModal
          shareType="section"
          section={sectionName}
          // token hata diya hai
          onClose={() => setShowShareSection(false)}
        />
      )}
    </div>
  );
}

export default SectionView;