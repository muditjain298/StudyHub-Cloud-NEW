const sdk = require('node-appwrite');

const client = new sdk.Client()
  .setEndpoint(
    process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1'
  )
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

module.exports = {
  client,

  getCaller: async (headers) => {
    const jwt = headers['x-appwrite-user-jwt'];

    if (!jwt) {
      throw new Error('Authenticated Appwrite session required');
    }

    const userClient = new sdk.Client()
      .setEndpoint(
        process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1'
      )
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setJWT(jwt);

    return new sdk.Account(userClient).get();
  },

  tablesDB: new sdk.TablesDB(client),

  storage: new sdk.Storage(client),

  users: new sdk.Users(client),

  sdk,

  ids: {
    database: process.env.APPWRITE_DATABASE_ID,

    profiles:
      process.env.APPWRITE_PROFILE_COLLECTION_ID || 'profiles',

    content:
      process.env.APPWRITE_PREMIUM_CONTENT_COLLECTION_ID ||
      'premiumContent',

    payments:
      process.env.APPWRITE_PAYMENTS_COLLECTION_ID || 'payment',
  },
};