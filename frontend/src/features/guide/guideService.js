import { Permission, Role } from 'appwrite';
import { appwriteConfig, tablesDB } from '../../lib/appwrite';

const GUIDE_ROW_ID = 'study-guide';

const guideService = {
  get() {
    return tablesDB.getRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.guideTableId,
      rowId: GUIDE_ROW_ID,
    });
  },

  async save(content, userId) {
    if (!appwriteConfig.adminUserId || userId !== appwriteConfig.adminUserId) {
      throw new Error('Only the configured admin can edit this guide.');
    }

    const data = {
      content: JSON.stringify(content),
      updatedBy: userId,
    };

    try {
      await this.get();
      return tablesDB.updateRow({
        databaseId: appwriteConfig.databaseId,
        tableId: appwriteConfig.guideTableId,
        rowId: GUIDE_ROW_ID,
        data,
      });
    } catch (error) {
      if (error.code !== 404) throw error;

      return tablesDB.createRow({
        databaseId: appwriteConfig.databaseId,
        tableId: appwriteConfig.guideTableId,
        rowId: GUIDE_ROW_ID,
        permissions: [
          Permission.read(Role.users()),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ],
        data,
      });
    }
  },
};

export default guideService;