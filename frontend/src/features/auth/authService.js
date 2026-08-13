import { account, ID } from '../../lib/appwrite'; 

// Register user 
export const register = async ({ name, email, password }) => {
   // Create account
    await account.create( ID.unique(), email, password, name ); 
    // Auto login after register
     await account.createEmailPasswordSession( email, password ); 
     // Return current user
      return await account.get(); };
       // Login user
        export const login = async ({ email, password }) => {
           await account.createEmailPasswordSession( email, password );
            return await account.get(); };
   // Logout user 
   export const logout = async () => {
     await account.deleteSession({ sessionId: 'current' }); };
     // Get current logged in user 
     export const getCurrentUser = async () => {
       try {
         return await account.get();
         } catch (error) { return null;
         } }; 
         
         const authService = {
           register, 
           login,
            logout, 
            getCurrentUser, }; 
            
            export default authService;