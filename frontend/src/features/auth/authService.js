import { account, ID } from '../../lib/appwrite';

// Register user 
export const register = async ({ name, email, password }) => {
  try {
    // Create account
    await account.create(ID.unique(), email, password, name);
    // Auto login after register
    await account.createEmailPasswordSession(email, password);
    
    // Return current user & save to localStorage
    const user = await account.get();
    localStorage.setItem('user', JSON.stringify(user)); 
    return user;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
};

// Login user
export const login = async ({ email, password }) => {
  try {
    await account.createEmailPasswordSession(email, password);
    
    // Get user details & save to localStorage
    const user = await account.get();
    localStorage.setItem('user', JSON.stringify(user));
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
  } catch (error) {
    console.log("Appwrite session pehle se clear hai.");
  } finally {
    localStorage.removeItem('user');
  }
};

// Get current logged in user 
export const getCurrentUser = async () => {
  try {
    return await account.get();
  } catch (error) {
    return null;
  }
};

// Password recovery - email bhej
export const createPasswordRecovery = async (email) => {
  try {
    const response = await account.createRecovery(
      email,
      'http://localhost:5173/reset-password'
    );
    return response;
  } catch (error) {
    console.error('Recovery error:', error);
    throw error;
  }
};

// Password reset - naya password set kar
export const confirmPasswordRecovery = async (userId, secret, newPassword) => {
  try {
    const response = await account.updateRecovery(userId, secret, newPassword);
    return response;
  } catch (error) {
    console.error('Reset error:', error);
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
};

export default authService;
