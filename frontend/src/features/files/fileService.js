import {
  tablesDB,
  storage,
  appwriteConfig,
  ID,
} from '../../lib/appwrite';

import { Query } from 'appwrite';

// ---------------- FOLDERS ----------------

const getFolders = async (
  userId,
  section,
  parentId = null
) => {
  const queries = [
    Query.equal('userId', userId),
  ];

  if (section) {
    queries.push(
      Query.equal('section', section)
    );
  }

  queries.push(
    parentId
      ? Query.equal('parent', parentId)
      : Query.isNull('parent')
  );

  const response = await tablesDB.listRows({
    databaseId: appwriteConfig.databaseId,
    tableId: appwriteConfig.folderCollectionId,
    queries,
  });

  return response.rows;
};

const createFolder = async (folderData) => {
  const response = await tablesDB.createRow({
    databaseId: appwriteConfig.databaseId,
    tableId: appwriteConfig.folderCollectionId,
    rowId: ID.unique(),
    data: {
      name: folderData.name,
      userId: folderData.userId,
      section: folderData.section,
      parent: folderData.parent,
    },
  });

  return response;
};

const deleteFolder = async (folderId) => {
  const response = await tablesDB.deleteRow({
    databaseId: appwriteConfig.databaseId,
    tableId: appwriteConfig.folderCollectionId,
    rowId: folderId,
  });

  return response;
};

const updateFolder = async (
  folderId,
  data
) => {
  return tablesDB.updateRow({
    databaseId: appwriteConfig.databaseId,
    tableId: appwriteConfig.folderCollectionId,
    rowId: folderId,
    data,
  });
};

// ---------------- FILES / NOTES ----------------

// 1. Files lana — ab section se bhi filter hota hai
const getFiles = async (
  folderId,
  section
) => {
  const queries = [];

  queries.push(
    folderId
      ? Query.equal('folderId', folderId)
      : Query.isNull('folderId')
  );

  if (section) {
    queries.push(
      Query.equal('section', section)
    );
  }

  const response = await tablesDB.listRows({
    databaseId: appwriteConfig.databaseId,
    tableId: appwriteConfig.notesCollectionId,
    queries,
  });

  return response.rows;
};

// 2. Actual file upload
// formData yaha ek REAL browser FormData object hai
const uploadFile = async (formData) => {
  const file = formData.get('file');
  const section = formData.get('section');
  const folderId = formData.get('folder');
  const difficulty = formData.get('difficulty');
  const userId = formData.get('userId');

  if (!file) {
    throw new Error(
      'No file provided to uploadFile'
    );
  }

  // Step 1: Real file ko Appwrite Storage bucket mein daalo
  const uploadedFile =
    await storage.createFile(
      appwriteConfig.bucketId,
      ID.unique(),
      file
    );

  // Step 2: Us file ka viewable URL banao
  const rawUrl = storage.getFileView(
    appwriteConfig.bucketId,
    uploadedFile.$id
  );

  const fileUrl =
    typeof rawUrl === 'string'
      ? rawUrl
      : rawUrl?.href ||
        rawUrl?.toString();

  // Step 3: Metadata Notes table mein save karo
  const response =
    await tablesDB.createRow({
      databaseId:
        appwriteConfig.databaseId,
      tableId:
        appwriteConfig.notesCollectionId,
      rowId: ID.unique(),
      data: {
        title: file.name,
        fileId: uploadedFile.$id,
        folderId: folderId || null,
        userId,
        fileUrl,
        section: section || null,
        difficulty: difficulty || null,
      },
    });

  return response;
};

// 3. External link save karna
// linkData: { name, fileUrl, section, folder, thumbnail, mimeType, userId }
const uploadLink = async (
  linkData
) => {
  const response =
    await tablesDB.createRow({
      databaseId:
        appwriteConfig.databaseId,
      tableId:
        appwriteConfig.notesCollectionId,
      rowId: ID.unique(),
      data: {
        title: linkData.name,
        fileId: `link-${ID.unique()}`,
        folderId:
          linkData.folder || null,
        userId: linkData.userId,
        fileUrl: linkData.fileUrl,
        section:
          linkData.section || null,
      },
    });

  return response;
};

// 4. Link ka metadata
const fetchMetadata = async (
  url
) => {
  return {
    title: url,
    thumbnail: null,
  };
};

// 5. File delete karna
const deleteFile = async (
  rowId
) => {
  const doc =
    await tablesDB.getRow({
      databaseId:
        appwriteConfig.databaseId,
      tableId:
        appwriteConfig.notesCollectionId,
      rowId,
    });

  if (
    doc.fileId &&
    !doc.fileId.startsWith('link-')
  ) {
    try {
      await storage.deleteFile(
        appwriteConfig.bucketId,
        doc.fileId
      );
    } catch (err) {
      console.warn(
        'Storage file already missing or failed to delete:',
        err
      );
    }
  }

  const response =
    await tablesDB.deleteRow({
      databaseId:
        appwriteConfig.databaseId,
      tableId:
        appwriteConfig.notesCollectionId,
      rowId,
    });

  return response;
};

const updateFile = async (
  rowId,
  data
) => {
  return tablesDB.updateRow({
    databaseId:
      appwriteConfig.databaseId,
    tableId:
      appwriteConfig.notesCollectionId,
    rowId,
    data,
  });
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