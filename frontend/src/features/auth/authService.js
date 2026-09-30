import { account, tablesDB, appwriteConfig, ID } from '../../lib/appwrite';
import { Permission, Role } from 'appwrite';

// --------------------------------------------------
// Add profile information to the Appwrite user
// --------------------------------------------------

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
      $id: user.$id,
      profileId: profile.$id,
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
        error?.message
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

// --------------------------------------------------
// Make sure profile row exists
// --------------------------------------------------

const ensureProfile = async (user) => {
  try {
    await tablesDB.getRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.profileCollectionId,
      rowId: user.$id,
    });
  } catch (error) {
    if (error?.code === 404) {
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
      } catch (createError) {
        if (createError?.code !== 409) {
          console.warn(
            'Profile creation failed:',
            createError?.message
          );
        }
      }
    } else {
      console.warn(
        'Profile check failed:',
        error?.message
      );
    }
  }

  return withProfile(user);
};

// --------------------------------------------------
// Register user
// --------------------------------------------------

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

// --------------------------------------------------
// Login user
// --------------------------------------------------

export const login = async ({
  email,
  password,
}) => {
  try {
    await account.createEmailPasswordSession(
      email,
      password
    );

    const user = await ensureProfile(
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

// --------------------------------------------------
// Logout user
// --------------------------------------------------

export const logout = async () => {
  try {
    await account.deleteSession('current');
  } catch (error) {
    console.log(
      'Appwrite session pehle se clear hai.'
    );
  } finally {
    localStorage.removeItem('user');
  }
};

// --------------------------------------------------
// Get current logged-in user
// --------------------------------------------------

export const getCurrentUser = async () => {
  try {
    return await ensureProfile(
      await account.get()
    );
  } catch (error) {
    return null;
  }
};

// --------------------------------------------------
// Password recovery - send email
// --------------------------------------------------

export const createPasswordRecovery = async (email) => {
  try {
   const recoveryUrl =
  'https://study-hub-cloud-new-xdoh.vercel.app/resetpassword';
    console.log(
      '[Password Recovery] URL:',
      recoveryUrl
    );

    const response = await account.createRecovery({
      email: email.trim(),
      url: recoveryUrl,
    });

    console.log(
      '[Password Recovery] Email sent successfully'
    );

    return response;
  } catch (error) {
    console.error(
      '[Password Recovery] Failed:',
      error
    );

    console.error(
      'Recovery error code:',
      error?.code
    );

    console.error(
      'Recovery error type:',
      error?.type
    );

    console.error(
      'Recovery error message:',
      error?.message
    );

    throw error;
  }
};

// --------------------------------------------------
// Password recovery - set new password
// --------------------------------------------------

export const confirmPasswordRecovery = async (
  userId,
  secret,
  newPassword
) => {
  try {
    const response =
      await account.updateRecovery({
        userId,
        secret,
        password: newPassword,
      });

    return response;
  } catch (error) {
    console.error(
      '[Password Reset] Failed:',
      error
    );

    console.error(
      'Reset error code:',
      error?.code
    );

    console.error(
      'Reset error type:',
      error?.type
    );

    console.error(
      'Reset error message:',
      error?.message
    );

    throw error;
  }
};

// --------------------------------------------------
// Export service
// --------------------------------------------------

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  createPasswordRecovery,
  confirmPasswordRecovery,
  withProfile,
  ensureProfile,
};

export default authService;