import {
  tablesDB,
  functions,
  storage,
  appwriteConfig,
  ID,
} from '../../lib/appwrite';

import {
  Query,
  Permission,
  Role,
} from 'appwrite';

/*
 * IMPORTANT:
 * Browser/client side se sirf current logged-in user ki
 * permissions create ki ja rahi hain.
 *
 * Admin ko doosre users ki rows manage karne ki permission
 * client se dena Appwrite allow nahi karta.
 *
 * Admin-wide management hum server-side function se karenge.
 */
const getRowPermissions = (userId, isAdmin = false) => {
  if (!userId) {
    throw new Error('User ID is required.');
  }

  if (isAdmin) {
    // Admin-created content:
    // All authenticated users can read it.
    // Only admin can update/delete it.
    return [
      Permission.read(Role.users()),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ];
  }

  // Normal user-created content:
  // Only the owner can read/update/delete.
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];
};

const contentSections = {
  note: 'Notes',
  video: 'Video Links',
  questionbank: 'Question Banks',
  ppt: 'PPTs',
  report: 'Reports',
};

const premiumService = {
  // ---------------- FOLDERS ----------------

  async getFolders(userId, section, parentId = null) {
    const queries = [
      Query.equal('section', section),
      parentId
        ? Query.equal('parent', parentId)
        : Query.isNull('parent'),
    ];

    const response = await tablesDB.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.premiumFoldersCollectionId,
      queries,
    });

    return response.rows;
  },

  async createFolder({
    name,
    userId,
    section,
    parent = null,
    isAdmin = false,
  }) {
    if (!name?.trim()) {
      throw new Error('Folder name is required.');
    }

    if (!userId) {
      throw new Error('User ID is required.');
    }

    return tablesDB.createRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.premiumFoldersCollectionId,
      rowId: ID.unique(),

      permissions: getRowPermissions(
        userId,
        isAdmin
      ),

      data: {
        name: name.trim(),
        userId,
        section,
        parent,
      },
    });
  },

  async updateFolder(folderId, data) {
    return tablesDB.updateRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.premiumFoldersCollectionId,
      rowId: folderId,
      data,
    });
  },

  async deleteFolder(folderId) {
    return tablesDB.deleteRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.premiumFoldersCollectionId,
      rowId: folderId,
    });
  },

  // ---------------- FILES ----------------

  async getFiles(userId, section, folderId = null) {
    const queries = [
      Query.equal('section', section),
      folderId
        ? Query.equal('folderId', folderId)
        : Query.isNull('folderId'),
    ];

    const response = await tablesDB.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.premiumFilesCollectionId,
      queries,
    });

    return response.rows;
  },

  async uploadFile({
    file,
    title,
    userId,
    section,
    folderId = null,
    type,
    isAdmin = false,
  }) {
    if (!file) {
      throw new Error('No file provided.');
    }

    if (!userId) {
      throw new Error('User ID is required.');
    }

    // 1. Upload actual file to Premium bucket
    const uploadedFile = await storage.createFile(
      appwriteConfig.premiumBucketId,
      ID.unique(),
      file
    );

    // 2. Generate view URL
    const rawUrl = storage.getFileView(
      appwriteConfig.premiumBucketId,
      uploadedFile.$id
    );

    const fileUrl =
      typeof rawUrl === 'string'
        ? rawUrl
        : rawUrl?.href || rawUrl?.toString();

    try {
      // 3. Save file metadata
      return await tablesDB.createRow({
        databaseId: appwriteConfig.databaseId,
        tableId: appwriteConfig.premiumFilesCollectionId,
        rowId: ID.unique(),

        permissions: getRowPermissions(
          userId,
          isAdmin
        ),

        data: {
          title: title || file.name,
          fileId: uploadedFile.$id,
          fileUrl,
          userId,
          section,
          folderId,
          type,
        },
      });
    } catch (error) {
      // Roll back storage upload if DB row creation fails
      try {
        await storage.deleteFile(
          appwriteConfig.premiumBucketId,
          uploadedFile.$id
        );
      } catch {
        // Ignore cleanup failure
      }

      throw error;
    }
  },

  async uploadLink({
    title,
    fileUrl,
    userId,
    section,
    folderId = null,
    type = 'video',
    isAdmin = false,
  }) {
    if (!title?.trim()) {
      throw new Error('Title is required.');
    }

    if (!fileUrl?.trim()) {
      throw new Error('File URL is required.');
    }

    if (!userId) {
      throw new Error('User ID is required.');
    }

    return tablesDB.createRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.premiumFilesCollectionId,
      rowId: ID.unique(),

      permissions: getRowPermissions(
        userId,
        isAdmin
      ),

      data: {
        title: title.trim(),
        fileId: `link-${ID.unique()}`,
        fileUrl: fileUrl.trim(),
        userId,
        section,
        folderId,
        type,
      },
    });
  },

  async updateFile(fileId, data) {
    return tablesDB.updateRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.premiumFilesCollectionId,
      rowId: fileId,
      data,
    });
  },

  async deleteFile(file) {
    // Delete actual Storage file
    if (
      file.fileId &&
      !file.fileId.startsWith('link-')
    ) {
      try {
        await storage.deleteFile(
          appwriteConfig.premiumBucketId,
          file.fileId
        );
      } catch (error) {
        console.warn(
          'Premium storage file already missing or failed to delete:',
          error
        );
      }
    }

    // Delete DB row
    return tablesDB.deleteRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.premiumFilesCollectionId,
      rowId: file.$id,
    });
  },

  async listContent(userId) {
    if (!userId) {
      throw new Error('User ID is required.');
    }

    const rowsBySection = await Promise.all(
      Object.values(contentSections).map((section) =>
        this.getFiles(userId, section)
      )
    );

    return rowsBySection
      .flat()
      .filter((row) => row.userId === userId);
  },

  async uploadContent({
    file,
    title,
    type,
    videoUrl,
    adminId,
  }) {
    const section = contentSections[type];

    if (!section) {
      throw new Error('Unsupported premium content type.');
    }

    if (type === 'video') {
      return this.uploadLink({
        title,
        fileUrl: videoUrl,
        userId: adminId,
        section,
        type,
        isAdmin: true,
      });
    }

    return this.uploadFile({
      file,
      title,
      userId: adminId,
      section,
      type,
      isAdmin: true,
    });
  },

  updateContent(contentId, data) {
    return this.updateFile(contentId, data);
  },

  deleteContent(content) {
    return this.deleteFile(content);
  },

  // ---------------- STARS ----------------

  async listStars(userId) {
    const response = await tablesDB.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.premiumStarsCollectionId,
      queries: [
        Query.equal('userId', userId),
        Query.limit(100),
      ],
    });

    return new Set(
      response.rows.map(
        (star) => star.contentId
      )
    );
  },

  async toggleStar(
    userId,
    contentId,
    starred
  ) {
    const rowId = `${userId}_${contentId}`;

    if (starred) {
      return tablesDB.deleteRow({
        databaseId: appwriteConfig.databaseId,
        tableId: appwriteConfig.premiumStarsCollectionId,
        rowId,
      });
    }

    return tablesDB.createRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.premiumStarsCollectionId,
      rowId,

      permissions: [
        Permission.read(
          Role.user(userId)
        ),
        Permission.update(
          Role.user(userId)
        ),
        Permission.delete(
          Role.user(userId)
        ),
      ],

      data: {
        userId,
        contentId,
        createdAt: new Date().toISOString(),
      },
    });
  },

  // ---------------- VIDEO METADATA ----------------

  async fetchMetadata(url) {
    return {
      title: url,
      thumbnail: null,
    };
  },

  // ---------------- APPWRITE FUNCTIONS ----------------

  async execute(functionId, payload) {
    if (!functionId) {
      throw new Error(
        'The required Appwrite Function ID is not configured.'
      );
    }

    const execution =
      await functions.createExecution(
        functionId,
        JSON.stringify(payload),
        false
      );

    if (execution.statusCode >= 400) {
      throw new Error(
        execution.responseBody ||
          'Premium function failed.'
      );
    }

    return execution.responseBody
      ? JSON.parse(execution.responseBody)
      : execution;
  },

  createOrder() {
    return this.execute(
      appwriteConfig.createOrderFunctionId,
      {}
    );
  },

  verifyPayment(payload) {
    return this.execute(
      appwriteConfig.verifyPaymentFunctionId,
      payload
    );
  },

  getSecureView(contentId) {
    return this.execute(
      appwriteConfig.downloadFunctionId,
      {
        contentId,
        disposition: 'inline',
      }
    );
  },

  getSecureDownload(contentId) {
    return this.execute(
      appwriteConfig.downloadFunctionId,
      {
        contentId,
      }
    );
  },

  findUser(query) {
    return this.execute(
      appwriteConfig.adminFunctionId,
      {
        action: 'find',
        query,
      }
    );
  },

  setUserPremium(userId, isPremium) {
    return this.execute(
      appwriteConfig.adminFunctionId,
      {
        userId,
        isPremium,
      }
    );
  },
};

export default premiumService;