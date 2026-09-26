import { account, tablesDB, appwriteConfig, ID } from '../../lib/appwrite';

import { Permission, Role } from 'appwrite';

const withProfile = async (user) => {
  const prefs = user.prefs || {};

  try {
    const profile = await tablesDB.getRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.profileCollectionId,
      rowId: user.$id,
    });

    return {
      ...profile,

      // IMPORTANT:
      // Appwrite Account ID ko profile row ke $id se overwrite nahi hone dena
      $id: user.$id,

      // Profile row ki ID alag preserve kar rahe hain
      profileId: profile.$id,

      // Account ki original information
      name: profile.name || user.name || '',
      email: profile.email || user.email || '',

      role: prefs.role || profile.role || 'user',
      isPremium: Boolean(
        prefs.isPremium ?? profile.isPremium
      ),

      prefs: {
        ...prefs,
        role: prefs.role || profile.role || 'user',
        isPremium: Boolean(
          prefs.isPremium ?? profile.isPremium
        ),
      },
    };
  } catch (error) {
    if (error?.code !== 404) {
      console.warn(
        'Profile lookup failed:',
        error.message
      );
    }

    return {
      ...user,
      role: prefs.role || 'user',
      isPremium: Boolean(prefs.isPremium),
      prefs,
    };
  }
};

const ensureProfile = async (user) => {
  try {
    await tablesDB.createRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.profileCollectionId,
      rowId: user.$id,
      data: {
        name: user.name || '',
        email: user.email || '',
        isPremium: false,
        role: 'user',
        grantedBy: null,
        grantedAt: null,
      },
      permissions: [
        Permission.read(Role.user(user.$id)),
      ],
    });
  } catch (error) {
    if (error?.code !== 409) {
      console.warn(
        'Profile creation failed:',
        error.message
      );
    }
  }

  return withProfile(user);
};

// Register user
export const register = async ({
  name,
  email,
  password,
}) => {
  try {
    await account.create(
      ID.unique(),
      email,
      password,
      name
    );

    await account.createEmailPasswordSession(
      email,
      password
    );

    await account.updatePrefs({
      role: 'user',
      isPremium: false,
    });

    const user = await ensureProfile(
      await account.get()
    );

    localStorage.setItem(
      'user',
      JSON.stringify(user)
    );

    return user;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
};

// Login user
export const login = async ({
  email,
  password,
}) => {
  try {
    await account.createEmailPasswordSession(
      email,
      password
    );

    const user = await withProfile(
      await account.get()
    );

    localStorage.setItem(
      'user',
      JSON.stringify(user)
    );

    return user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Logout user
export const logout = async () => {
  try {
    await account.deleteSession('current');
  } catch {
    console.log(
      'Appwrite session pehle se clear hai.'
    );
  } finally {
    localStorage.removeItem('user');
  }
};

// Get current logged in user
export const getCurrentUser = async () => {
  try {
    return await withProfile(
      await account.get()
    );
  } catch {
    return null;
  }
};

// Password recovery - email bhej
export const createPasswordRecovery = async (
  email
) => {
  try {
    const response =
      await account.createRecovery(
        email,
        'http://localhost:5173/reset-password'
      );

    return response;
  } catch (error) {
    console.error(
      'Recovery error:',
      error
    );
    throw error;
  }
};

// Password reset - naya password set kar
export const confirmPasswordRecovery = async (
  userId,
  secret,
  newPassword
) => {
  try {
    const response =
      await account.updateRecovery(
        userId,
        secret,
        newPassword
      );

    return response;
  } catch (error) {
    console.error(
      'Reset error:',
      error
    );
    throw error;
  }
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  createPasswordRecovery,
  confirmPasswordRecovery,
  withProfile,
};

export default authService;