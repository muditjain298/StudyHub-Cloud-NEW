import { databases, storage, appwriteConfig, ID } from '../../lib/appwrite';
import { Query } from 'appwrite';

// ---------------- FOLDERS ----------------

const getFolders = async (userId, section, parentId = null) => {
  const queries = [Query.equal('userId', userId)];
  if (section) queries.push(Query.equal('section', section));
  queries.push(parentId ? Query.equal('parent', parentId) : Query.isNull('parent'));

  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.folderCollectionId,
    queries
  );
  return response.documents;
};

const createFolder = async (folderData) => {
  const response = await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.folderCollectionId,
    ID.unique(),
    {
      name: folderData.name,
      userId: folderData.userId,
      section: folderData.section,
      parent: folderData.parent,
    }
  );
  return response;
};

const deleteFolder = async (folderId) => {
  const response = await databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.folderCollectionId,
    folderId
  );
  return response;
};

const updateFolder = async (folderId, data) => {
  return databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.folderCollectionId,
    folderId,
    data
  );
};

// ---------------- FILES / NOTES ----------------

// 1. Files lana — ab section se bhi filter hota hai (Bug C fix)
const getFiles = async (folderId, section) => {
  const queries = [];
  queries.push(folderId ? Query.equal('folderId', folderId) : Query.isNull('folderId'));
  if (section) queries.push(Query.equal('section', section));

  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.notesCollectionId,
    queries
  );
  return response.documents;
};

// 2. Actual file upload
// formData yaha ek REAL browser FormData object hai (SectionView.jsx se aata hai)
const uploadFile = async (formData) => {
  const file = formData.get('file');
  const section = formData.get('section');
  const folderId = formData.get('folder'); // SectionView 'folder' key se bhejta hai
  const difficulty = formData.get('difficulty');
  const userId = formData.get('userId');

  if (!file) {
    throw new Error('No file provided to uploadFile');
  }

  // Step 1: Real file ko Appwrite Storage bucket mein daalo
  const uploadedFile = await storage.createFile(
    appwriteConfig.bucketId,
    ID.unique(),
    file
  );

  // Step 2: Us file ka viewable URL banao
  const rawUrl = storage.getFileView(appwriteConfig.bucketId, uploadedFile.$id);
  const fileUrl = typeof rawUrl === 'string' ? rawUrl : rawUrl?.href || rawUrl?.toString();

  // Step 3: Metadata "notes" collection mein save karo
  const response = await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.notesCollectionId,
    ID.unique(),
    {
      title: file.name,
      fileId: uploadedFile.$id,
      folderId: folderId || null,
      userId,
      fileUrl,
      section: section || null,
      difficulty: difficulty || null,
    }
  );

  return response;
};

// 3. External link save karna
// linkData plain object hai: { name, fileUrl, section, folder, thumbnail, mimeType, userId }
const uploadLink = async (linkData) => {
  const response = await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.notesCollectionId,
    ID.unique(),
    {
      title: linkData.name,
      fileId: `link-${ID.unique()}`, // real Storage file nahi hai, placeholder
      folderId: linkData.folder || null,
      userId: linkData.userId,
      fileUrl: linkData.fileUrl,
      section: linkData.section || null,
    }
  );
  return response;
};

// 4. Link ka metadata (title) fetch karna
const fetchMetadata = async (url) => {
  return { title: url, thumbnail: null };
};

// 5. File delete karna (Storage + Database dono se)
const deleteFile = async (documentId) => {
  const doc = await databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.notesCollectionId,
    documentId
  );

  if (doc.fileId && !doc.fileId.startsWith('link-')) {
    try {
      await storage.deleteFile(appwriteConfig.bucketId, doc.fileId);
    } catch (err) {
      console.warn('Storage file already missing or failed to delete:', err);
    }
  }

  const response = await databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.notesCollectionId,
    documentId
  );
  return response;
};

const updateFile = async (documentId, data) => {
  return databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.notesCollectionId,
    documentId,
    data
  );
};

const fileService = {
  getFolders,
  createFolder,
  deleteFolder,
  updateFolder,
  getFiles,
  uploadFile,
  uploadLink,
  fetchMetadata,
  deleteFile,
  updateFile,
};

export default fileService;