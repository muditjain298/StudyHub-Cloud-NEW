import { Client, Account, Databases, Storage, ID } from 'appwrite'; 

const client = new Client(); 
client 
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('6a7d7d73000d5a0b6a27'); 

// Services initialize kar rahe hain
export const account = new Account(client); 
export const databases = new Databases(client); // Database connection
export const storage = new Storage(client);     // Storage connection

// .env variables ko ek jagah rakh liya taaki baar-baar import.meta na likhna pade
export const appwriteConfig = {
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
    folderCollectionId: import.meta.env.VITE_APPWRITE_FOLDER_COLLECTION_ID,
    notesCollectionId: import.meta.env.VITE_APPWRITE_NOTES_COLLECTION_ID,
    bucketId: import.meta.env.VITE_APPWRITE_BUCKET_ID,
};

export { ID };