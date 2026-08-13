// frontend/src/lib/appwrite.js
import { Client, Account, ID } from 'appwrite'; 
const client = new Client(); 
client 
.setEndpoint('https://sgp.cloud.appwrite.io/v1')
 .setProject('6a7d7d73000d5a0b6a27'); 
 const account = new Account(client); 
 export { client, account, ID };