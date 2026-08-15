import { account, ID } from '../../lib/appwrite';

// Register user 
export const register = async ({ name, email, password }) => {
  // Create account
  await account.create(ID.unique(), email, password, name);
  // Auto login after register
  await account.createEmailPasswordSession(email, password);
  
  // Return current user & save to localStorage
  const user = await account.get();
  localStorage.setItem('user', JSON.stringify(user)); 
  return user;
};

// Login user
export const login = async ({ email, password }) => {
  await account.createEmailPasswordSession(email, password);
  
  // Get user details & save to localStorage
  const user = await account.get();
  localStorage.setItem('user', JSON.stringify(user));
  return user;
};

// Logout user 
export const logout = async () => {
  try {
    // Appwrite se session delete karne ki koshish karo
    await account.deleteSession('current');
  } catch (error) {
    // Agar Appwrite bole ki "session nahi hai", toh koi baat nahi, error ko ignore karo
    console.log("Appwrite session pehle se clear hai.");
  } finally {
    // Chahe jo ho jaye, localStorage se user hamesha delete hoga
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

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
};

export default authService;