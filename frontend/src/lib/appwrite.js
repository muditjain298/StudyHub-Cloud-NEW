import {
    Client,
    Account,
    TablesDB,
    Storage,
    Functions,
    ID,
} from 'appwrite';

const client = new Client();

client
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('6a7d7d73000d5a0b6a27');

// Appwrite services
export const account = new Account(client);
export const tablesDB = new TablesDB(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

// Appwrite configuration
export const appwriteConfig = {
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,

    folderCollectionId:
        import.meta.env.VITE_APPWRITE_FOLDER_COLLECTION_ID,

    notesCollectionId:
        import.meta.env.VITE_APPWRITE_NOTES_COLLECTION_ID,

    bucketId:
        import.meta.env.VITE_APPWRITE_BUCKET_ID,

    sharesCollectionId:
        import.meta.env.VITE_APPWRITE_SHARES_COLLECTION_ID,

    profileCollectionId:
        import.meta.env.VITE_APPWRITE_PROFILE_COLLECTION_ID || 'profiles',

    premiumContentCollectionId:
        import.meta.env.VITE_APPWRITE_PREMIUM_CONTENT_COLLECTION_ID ||
        'premiumContent',

    premiumStarsCollectionId:
        import.meta.env.VITE_APPWRITE_PREMIUM_STARS_COLLECTION_ID ||
        'premiumStars',

    paymentsCollectionId:
        import.meta.env.VITE_APPWRITE_PAYMENTS_COLLECTION_ID ||
        'payment',

    premiumBucketId:
        import.meta.env.VITE_APPWRITE_PREMIUM_BUCKET_ID ||
        import.meta.env.VITE_APPWRITE_BUCKET_ID,

    createOrderFunctionId:
        import.meta.env.VITE_APPWRITE_CREATE_ORDER_FUNCTION_ID,

    verifyPaymentFunctionId:
        import.meta.env.VITE_APPWRITE_VERIFY_PAYMENT_FUNCTION_ID,

    downloadFunctionId:
        import.meta.env.VITE_APPWRITE_PREMIUM_DOWNLOAD_FUNCTION_ID,

    adminFunctionId:
        import.meta.env.VITE_APPWRITE_ADMIN_PREMIUM_FUNCTION_ID,
        premiumFilesCollectionId:
    import.meta.env.VITE_APPWRITE_PREMIUM_FILES_COLLECTION_ID ||
    '6ab721400038768fe0d7',

premiumFoldersCollectionId:
    import.meta.env.VITE_APPWRITE_PREMIUM_FOLDERS_COLLECTION_ID ||
    '6ab71e870017fda0e8b4',
};

export { ID };
