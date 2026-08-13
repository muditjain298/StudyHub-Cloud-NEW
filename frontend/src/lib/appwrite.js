// frontend/src/lib/appwrite.js

import { Client, Account } from 'appwrite';

const client = new Client();

client
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('6a7d7e1000ed146842c');

export const account = new Account(client);