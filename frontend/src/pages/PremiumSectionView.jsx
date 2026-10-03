import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  FolderPlus,
  UploadCloud,
  ChevronLeft,
  Loader2,
  Link as LinkIcon,
  Search,
  Star,
  FileText,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import premiumService from '../features/premium/premiumService';
import { appwriteConfig, storage } from '../lib/appwrite';
import PdfViewer from '../components/PdfViewer';

function PremiumSectionView({ sectionName, onBack }) {
  const { user } = useSelector((state) => state.auth);

  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [stars, setStars] = useState(new Set());
  const [editingFileId, setEditingFileId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const folderOpenTimeout = useRef(null);

  const [currentFolder, setCurrentFolder] = useState(null);
  const folderHistory = useRef([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [savingLink, setSavingLink] = useState(false);

  // PDF viewer state
  const [viewingFile, setViewingFile] = useState(null); // { url, title }

  const isAdmin =
    user?.$id === appwriteConfig.adminUserId ||
    user?.prefs?.role === 'admin';

  const isPremiumUser = Boolean(user?.prefs?.isPremium) || isAdmin;

  // =========================================================
  // LOAD PREMIUM CONTENT
  // =========================================================

  const userId = user?.$id;
  const parentFolderId = currentFolder?.$id || null;

  const loadContent = useCallback(async () => {
    if (!userId) return;

    setLoading(true);

    try {
      const [folderRows, fileRows, savedStars] =
        await Promise.all([
          premiumService.getFolders(
            userId,
            sectionName,
            parentFolderId
          ),

          premiumService.getFiles(
            userId,
            sectionName,
            parentFolderId
          ),

          premiumService.listStars(userId),
        ]);

      setFolders(folderRows);
      setFiles(fileRows);
      setStars(savedStars);
    } catch (error) {
      console.error('[PremiumSectionView]', error);
      toast.error(
        error?.message ||
          'Unable to load premium content.'
      );
    } finally {
      setLoading(false);
    }
  }, [parentFolderId, sectionName, userId]);

  useEffect(() => {
    let isActive = true;
    queueMicrotask(() => {
      if (isActive) void loadContent();
    });

    return () => {
      isActive = false;
    };
  }, [loadContent]);

  // =========================================================
  // CREATE FOLDER (ADMIN ONLY)
  // =========================================================

  const handleCreateFolder = async () => {
    if (!isAdmin) {
      toast.error('Only admin can create folders.');
      return;
    }

    const name = window.prompt(
      'Enter premium folder name:'
    );

    if (!name || !name.trim()) return;

    try {
      await premiumService.createFolder({
        name: name.trim(),
        userId: user.$id,
        section: sectionName,
        parent: currentFolder?.$id || null,
        isAdmin,
      });

      toast.success('Folder created successfully.');

      await loadContent();
    } catch (error) {
      console.error('[createPremiumFolder]', error);
      toast.error(
        error?.message ||
          'Failed to create premium folder.'
      );
    }
  };

  // =========================================================
  // FILE UPLOAD (ADMIN ONLY)
  // =========================================================

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!isAdmin) {
      event.target.value = '';
      toast.error('Only admin can upload files.');
      return;
    }

    if (!file) return;

    setUploading(true);

    try {
      await premiumService.uploadFile({
        file,
        title: file.name,
        userId: user.$id,
        section: sectionName,
        folderId: currentFolder?.$id || null,
        type: sectionName
          .toLowerCase()
          .replace(/\s+/g, ''),
        isAdmin,
      });

      toast.success(
        'Premium file uploaded successfully.'
      );

      await loadContent();
    } catch (error) {
      console.error('[uploadPremiumFile]', error);
      toast.error(
        error?.message ||
          'Failed to upload premium file.'
      );
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  // =========================================================
  // ADD VIDEO LINK (ADMIN ONLY)
  // =========================================================

  const handleAddLink = async (event) => {
    event.preventDefault();

    if (!isAdmin) {
      toast.error('Only admin can add links.');
      return;
    }

    if (!linkTitle.trim()) {
      toast.error('Video title is required.');
      return;
    }

    if (!linkUrl.trim()) return;

    setSavingLink(true);

    try {
      await premiumService.uploadLink({
        title: linkTitle.trim(),

        fileUrl: linkUrl.trim(),

        userId: user.$id,

        section: sectionName,

        folderId:
          currentFolder?.$id || null,

        type: 'video',

        isAdmin,
      });

      toast.success(
        'Premium video link added.'
      );

      setShowLinkModal(false);
      setLinkUrl('');
      setLinkTitle('');

      await loadContent();
    } catch (error) {
      console.error('[uploadPremiumLink]', error);
      toast.error(
        error?.message ||
          'Failed to add video link.'
      );
    } finally {
      setSavingLink(false);
    }
  };

  // =========================================================
  // FOLDER NAVIGATION
  // =========================================================

  const navigateToFolder = (folder) => {
    folderHistory.current.push(currentFolder);

    setCurrentFolder(folder);
  };

  const navigateBack = () => {
    const previousFolder = folderHistory.current.pop();
    setCurrentFolder(previousFolder || null);
  };

  // =========================================================
  // STAR
  // =========================================================

  const toggleStar = async (file) => {
    const starred = stars.has(file.$id);

    try {
      await premiumService.toggleStar(
        user.$id,
        file.$id,
        starred
      );

      setStars((current) => {
        const next = new Set(current);

        if (starred) {
          next.delete(file.$id);
        } else {
          next.add(file.$id);
        }

        return next;
      });
    } catch (error) {
      console.error('[togglePremiumStar]', error);
      toast.error(
        error?.message ||
          'Could not update star.'
      );
    }
  };

  const handleRenameFolder = async (folder, value = editingFolderName) => {
    if (!isAdmin) return;

    const name = value.trim();
    setEditingFolderId(null);

    if (!name || name === folder.name) {
      setEditingFolderName(folder.name || '');
      return;
    }

    try {
      const updatedFolder = await premiumService.updateFolder(
        folder.$id,
        { name }
      );
      setFolders((current) =>
        current.map((item) =>
          item.$id === updatedFolder.$id
            ? { ...item, name: updatedFolder.name }
            : item
        )
      );
      toast.success('Premium folder renamed.');
    } catch (error) {
      setEditingFolderName(folder.name || '');
      toast.error(error?.message || 'Failed to rename folder.');
    }
  };

  const handleRenameFile = async (file, value = editingTitle) => {
    if (!isAdmin) return;

    const title = value.trim();
    setEditingFileId(null);

    if (!title || title === file.title) {
      setEditingTitle(file.title || '');
      return;
    }

    try {
      const updatedFile = await premiumService.updateFile(
        file.$id,
        { title }
      );
      setFiles((current) =>
        current.map((item) =>
          item.$id === updatedFile.$id
            ? { ...item, title: updatedFile.title }
            : item
        )
      );
      toast.success('Premium file renamed.');
    } catch (error) {
      setEditingTitle(file.title || '');
      toast.error(error?.message || 'Failed to rename file.');
    }
  };

  // =========================================================
  // DELETE FILE (ADMIN ONLY)
  // =========================================================

  const handleDeleteFile = async (file) => {
    if (!isAdmin) return;

    const confirmed = window.confirm(
      `Delete "${file.title}"?`
    );

    if (!confirmed) return;

    try {
      await premiumService.deleteFile(file);

      toast.success('Premium file deleted.');

      await loadContent();
    } catch (error) {
      console.error('[deletePremiumFile]', error);
      toast.error(
        error?.message ||
          'Failed to delete premium file.'
      );
    }
  };

  // =========================================================
  // DELETE FOLDER (ADMIN ONLY, deletes everything inside)
  // =========================================================

  const handleDeleteFolder = async (folder) => {
    if (!isAdmin) return;

    const confirmed = window.confirm(
      `Delete folder "${folder.name}" and everything inside it? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await premiumService.deleteFolder(folder.$id, isAdmin);

      toast.success('Premium folder deleted.');

      await loadContent();
    } catch (error) {
      console.error('[deletePremiumFolder]', error);
      toast.error(
        error?.message ||
          'Failed to delete premium folder.'
      );
    }
  };

  // =========================================================
  // SEARCH
  // =========================================================

  const normalizedSearch =
    searchTerm.trim().toLowerCase();

  const visibleFolders = folders.filter(
    (folder) =>
      !normalizedSearch ||
      `${folder.name} ${folder.section}`
        .toLowerCase()
        .includes(normalizedSearch)
  ).sort(
    (first, second) =>
      Number(stars.has(second.$id)) -
      Number(stars.has(first.$id))
  );

  const visibleFiles = files.filter(
    (file) =>
      !normalizedSearch ||
      [
        file.title,
        file.section,
        file.type,
        file.fileUrl,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
  ).sort(
    (first, second) =>
      Number(stars.has(second.$id)) -
      Number(stars.has(first.$id))
  );

  const hasItems =
    visibleFolders.length > 0 ||
    visibleFiles.length > 0;

  // =========================================================
  // UI
  // =========================================================

  return (
    <div>
      {/* HEADER */}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          {currentFolder ? (
            <button
              type="button"
              onClick={navigateBack}
              className="rounded-full bg-gray-200 p-2 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
              title="Go back"
            >
              <ChevronLeft className="h-5 w-5 dark:text-white" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg border border-violet-300 bg-white px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:bg-gray-800 dark:text-violet-200 dark:hover:bg-gray-700"
            >
              ← Sections
            </button>
          )}

          <div>
            <h1 className="text-2xl font-semibold text-violet-900 dark:text-violet-100">
              {sectionName}
              {currentFolder
                ? ` > ${currentFolder.name}`
                : ''}
            </h1>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Premium resources
            </p>
          </div>
        </div>

        {/* ACTIONS (ADMIN ONLY) */}

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCreateFolder}
              className="flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </button>

            {sectionName === 'Video Links' ? (
              <button
                type="button"
                onClick={() =>
                  setShowLinkModal(true)
                }
                className="flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                Add Link
              </button>
            ) : (
              <label className="flex cursor-pointer items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UploadCloud className="mr-2 h-4 w-4" />
                )}

                {uploading
                  ? 'Uploading...'
                  : 'Upload File'}

                <input
                  type="file"
                  className="hidden"
                  disabled={uploading}
                  onChange={handleFileUpload}
                />
              </label>
            )}
          </div>
        )}
      </div>

      {/* SEARCH */}

      <div className="mb-8">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <input
            type="search"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="Search folders and premium files..."
            className="w-full rounded-md border border-violet-300 bg-white py-2 pl-10 pr-3 text-sm text-violet-900 shadow-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-violet-600 dark:bg-gray-800 dark:text-violet-100"
          />
        </label>
      </div>

      {/* LOADING */}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* FOLDERS */}

          {visibleFolders.length > 0 && (
            <section>
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Folders
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleFolders.map(
                  (folder) => (
                    <article
                      key={folder.$id}
                      onClick={() => {
                        window.clearTimeout(folderOpenTimeout.current);
                        folderOpenTimeout.current = window.setTimeout(
                          () => navigateToFolder(folder),
                          220
                        );
                      }}
                      onKeyDown={(event) => {
                        if (event.target !== event.currentTarget) return;
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          navigateToFolder(folder);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className="group rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                        <div className="rounded-lg bg-indigo-100 p-3 dark:bg-indigo-900/40">
                          <FolderPlus className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>

                        <div className="min-w-0">
                          {editingFolderId === folder.$id ? (
                            <input
                              autoFocus
                              value={editingFolderName}
                              onChange={(event) =>
                                setEditingFolderName(event.target.value)
                              }
                              onClick={(event) => event.stopPropagation()}
                              onBlur={(event) =>
                                handleRenameFolder(
                                  folder,
                                  event.currentTarget.value
                                )
                              }
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.currentTarget.blur();
                                }
                                if (event.key === 'Escape') {
                                  event.currentTarget.value = folder.name || '';
                                  setEditingFolderName(folder.name || '');
                                  setEditingFolderId(null);
                                }
                              }}
                              aria-label="Rename premium folder"
                              className="w-full rounded border border-violet-400 bg-white px-1 font-semibold text-violet-900 outline-none dark:bg-gray-800 dark:text-violet-100"
                            />
                          ) : (
                            <h3
                              onDoubleClick={(event) => {
                                event.stopPropagation();
                                window.clearTimeout(folderOpenTimeout.current);
                                if (!isAdmin) {
                                  navigateToFolder(folder);
                                  return;
                                }
                                setEditingFolderName(folder.name || '');
                                setEditingFolderId(folder.$id);
                              }}
                              title={isAdmin ? 'Double-click to rename' : undefined}
                              className={`truncate font-semibold text-violet-900 dark:text-violet-100 ${isAdmin ? 'cursor-text' : ''}`}
                            >
                              {folder.name}
                            </h3>
                          )}

                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Premium folder
                          </p>
                        </div>
                        </div>

                        <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleStar(folder);
                          }}
                          aria-label={stars.has(folder.$id) ? 'Remove star from folder' : 'Star folder'}
                          title={stars.has(folder.$id) ? 'Remove star' : 'Star folder'}
                          className={stars.has(folder.$id) ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}
                        >
                          <Star
                            className="h-5 w-5"
                            fill={stars.has(folder.$id) ? 'currentColor' : 'none'}
                          />
                        </button>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeleteFolder(folder);
                            }}
                            aria-label="Delete folder"
                            title="Delete folder"
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                        </div>
                      </div>
                    </article>
                  )
                )}
              </div>
            </section>
          )}

          {/* FILES */}

          {visibleFiles.length > 0 && (
            <section>
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Files & Links
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleFiles.map((file) => {
                  const starred =
                    stars.has(file.$id);

                  const isVideo =
                    file.type === 'video';

                  return (
                    <article
                      key={file.$id}
                      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/40">
                            {isVideo ? (
                              <LinkIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            ) : (
                              <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            )}
                          </div>

                          <div className="min-w-0">
                            {editingFileId === file.$id ? (
                              <input
                                autoFocus
                                value={editingTitle}
                                onChange={(event) =>
                                  setEditingTitle(event.target.value)
                                }
                                onBlur={(event) =>
                                  handleRenameFile(
                                    file,
                                    event.currentTarget.value
                                  )
                                }
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    event.currentTarget.blur();
                                  }
                                  if (event.key === 'Escape') {
                                    event.currentTarget.value = file.title || '';
                                    setEditingTitle(file.title || '');
                                    setEditingFileId(null);
                                  }
                                }}
                                aria-label="Rename premium file"
                                className="w-full rounded border border-violet-400 bg-white px-1 font-semibold text-violet-900 outline-none dark:bg-gray-800 dark:text-violet-100"
                              />
                            ) : (
                              <h3
                                onDoubleClick={() => {
                                  if (!isAdmin) return;
                                  setEditingTitle(file.title || '');
                                  setEditingFileId(file.$id);
                                }}
                                title={isAdmin ? 'Double-click to rename' : undefined}
                                className={`truncate font-semibold text-violet-900 dark:text-violet-100 ${isAdmin ? 'cursor-text' : ''}`}
                              >
                                {file.title}
                              </h3>
                            )}

                            <p className="mt-1 text-xs uppercase tracking-wider text-indigo-500">
                              {file.type}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            toggleStar(file)
                          }
                          className={
                            starred
                              ? 'text-yellow-400'
                              : 'text-gray-400 hover:text-yellow-400'
                          }
                          aria-label={
                            starred
                              ? 'Unstar'
                              : 'Star'
                          }
                        >
                          <Star
                            className="h-5 w-5"
                            fill={
                              starred
                                ? 'currentColor'
                                : 'none'
                            }
                          />
                        </button>
                      </div>

                      {/* FILE ACTIONS */}
                      <div className="mt-5 flex gap-2">
                        {isVideo ? (
                          // Video links: open in new tab for everyone
                          <a
                            href={file.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Watch
                          </a>
                        ) : (
                          // Non-video (PDF, etc): open in read-only viewer
                          <button
                            type="button"
                            onClick={() => {
                              // Build view URL from fileId if available; fall back to stored fileUrl
                              const viewUrl =
                                file.fileId && !file.fileId.startsWith('link-')
                                  ? (() => {
                                      const raw = storage.getFileView(
                                        appwriteConfig.premiumBucketId,
                                        file.fileId
                                      );
                                      return typeof raw === 'string'
                                        ? raw
                                        : raw?.href || raw?.toString();
                                    })()
                                  : file.fileUrl;
                              setViewingFile({ url: viewUrl, title: file.title });
                            }}
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                          >
                            <FileText className="h-4 w-4" />
                            Open
                          </button>
                        )}

                        {isAdmin &&
                          file.userId ===
                            user.$id && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteFile(
                                file
                              )
                            }
                            className="rounded-lg border border-red-200 px-3 py-2 text-red-500 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* EMPTY */}

          {!hasItems && (
            <div className="py-20 text-center">
              <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />

              <h3 className="mt-3 text-sm font-semibold text-violet-900 dark:text-violet-100">
                {searchTerm
                  ? 'No matching items'
                  : 'No premium items found'}
              </h3>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm
                  ? 'Try another search.'
                  : isAdmin
                    ? 'Create a folder or add premium content to get started.'
                    : 'Premium content will appear here once it is added.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* VIDEO LINK MODAL (ADMIN ONLY) */}

      {isAdmin && showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-violet-900 dark:text-violet-100">
              Add Premium Video Link
            </h2>

            <form
              onSubmit={handleAddLink}
              className="mt-5 space-y-4"
            >
              <input
                type="text"
                required
                autoFocus
                value={linkTitle}
                onChange={(event) =>
                  setLinkTitle(event.target.value)
                }
                placeholder="Video title"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              <input
                type="url"
                required
                value={linkUrl}
                onChange={(event) =>
                  setLinkUrl(event.target.value)
                }
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkModal(false);
                    setLinkTitle('');
                    setLinkUrl('');
                  }}
                  className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingLink}
                  className="flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingLink && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}

                  Save Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF VIEWER MODAL */}
      {viewingFile && (
        <PdfViewer
          url={viewingFile.url}
          title={viewingFile.title}
          onClose={() => setViewingFile(null)}
        />
      )}
    </div>
  );
}

export default PremiumSectionView;