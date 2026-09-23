import { databases, functions, storage, appwriteConfig, ID } from '../../lib/appwrite';
import { Query } from 'appwrite';

const premiumService = {
  async listContent() {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.premiumContentCollectionId,
      [Query.orderDesc('createdAt'), Query.limit(100)]
    );
    return response.documents;
  },

  async listStars(userId) {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.premiumStarsCollectionId,
      [Query.equal('userId', userId), Query.limit(100)]
    );
    return new Set(response.documents.map((star) => star.contentId));
  },

  async toggleStar(userId, contentId, starred) {
    const documentId = `${userId}_${contentId}`;
    if (starred) {
      await databases.deleteDocument(appwriteConfig.databaseId, appwriteConfig.premiumStarsCollectionId, documentId);
    } else {
      await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.premiumStarsCollectionId,
        documentId,
        { userId, contentId, createdAt: new Date().toISOString() }
      );
    }
  },

  async uploadContent({ file, title, type, videoUrl, adminId }) {
    let fileId = null;
    if (file) {
      const uploaded = await storage.createFile(appwriteConfig.premiumBucketId, ID.unique(), file);
      fileId = uploaded.$id;
    }
    return databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.premiumContentCollectionId,
      ID.unique(),
      { title, type, fileId, videoUrl: type === 'video' ? videoUrl : null, uploadedBy: adminId, createdAt: new Date().toISOString() }
    );
  },

  updateContent(contentId, data) {
    return databases.updateDocument(appwriteConfig.databaseId, appwriteConfig.premiumContentCollectionId, contentId, data);
  },

  async deleteContent(content) {
    if (content.fileId) await storage.deleteFile(appwriteConfig.premiumBucketId, content.fileId);
    return databases.deleteDocument(appwriteConfig.databaseId, appwriteConfig.premiumContentCollectionId, content.$id);
  },

  async execute(functionId, payload) {
    if (!functionId) throw new Error('The required Appwrite Function ID is not configured.');
    const execution = await functions.createExecution(functionId, JSON.stringify(payload), false);
    if (execution.statusCode >= 400) throw new Error(execution.responseBody || 'Premium function failed.');
    return execution.responseBody ? JSON.parse(execution.responseBody) : execution;
  },

  createOrder() { return this.execute(appwriteConfig.createOrderFunctionId, {}); },
  verifyPayment(payload) { return this.execute(appwriteConfig.verifyPaymentFunctionId, payload); },
  getSecureView(contentId) { return this.execute(appwriteConfig.downloadFunctionId, { contentId, disposition: 'inline' }); },
  getSecureDownload(contentId) { return this.execute(appwriteConfig.downloadFunctionId, { contentId }); },
  findUser(query) { return this.execute(appwriteConfig.adminFunctionId, { action: 'find', query }); },
  setUserPremium(userId, isPremium) { return this.execute(appwriteConfig.adminFunctionId, { userId, isPremium }); },
};

export default premiumService;