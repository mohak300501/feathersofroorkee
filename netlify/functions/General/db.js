// Polyfill global crypto for MongoDB/BSON in serverless environments
const { webcrypto } = require('node:crypto');
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = webcrypto;
}

const { MongoClient } = require('mongodb');
const dns = require('dns');

// Fix potential DNS lookup issues in some serverless Node environments
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn('Failed to set custom DNS servers:', e);
}

let cachedDb = null;

async function connectToDatabase(context) {
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  if (cachedDb) {
    return cachedDb;
  }

  const uri = process.env.MONGODB_CONNECTION_STRING;
  if (!uri) {
    throw new Error('Please define the MONGODB_CONNECTION_STRING environment variable');
  }

  // Set timeout options so that connection failures resolve within 5 seconds,
  // preventing Netlify functions from hitting the 10-second hard gateway timeout.
  // family: 4 forces IPv4, which avoids IPv6 connection delays/blocks.
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    family: 4
  });

  await client.connect();
  const db = client.db('feathersofroorkee'); // Automatically creates db if not exists

  cachedDb = db;
  return db;
}

module.exports = { connectToDatabase };
