const crypto = require('crypto');
const { connectToDatabase } = require('../General/db');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

function handleOptions(event) {
  return event.httpMethod === 'OPTIONS' ? response(200, {}) : null;
}

function requireMethod(event, method) {
  if (event.httpMethod !== method) {
    return response(405, { error: 'Method not allowed' });
  }
  return null;
}

function getSecretKey() {
  const secret = process.env.BINOC_SECRET;
  if (!secret) {
    throw new Error('BINOC_SECRET environment variable is not configured');
  }
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
}

function encryptBinocularPayload(payload) {
  const key = getSecretKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    'v1',
    iv.toString('base64url'),
    tag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join('.');
}

function decryptBinocularPayload(token) {
  if (typeof token !== 'string') throw new Error('QR payload must be a string');
  const parts = token.split('.');
  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new Error('Invalid QR payload');
  }

  const key = getSecretKey();
  const iv = Buffer.from(parts[1], 'base64url');
  const tag = Buffer.from(parts[2], 'base64url');
  const ciphertext = Buffer.from(parts[3], 'base64url');

  if (iv.length !== 12 || tag.length !== 16 || ciphertext.length === 0) {
    throw new Error('Invalid QR payload');
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(plaintext.toString('utf8'));
}

async function requireUser(db, userId) {
  if (!userId) throw Object.assign(new Error('Authentication required'), { statusCode: 401 });
  const user = await db.collection('users').findOne({ uid: userId });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return user;
}

async function requireAdmin(db, userId) {
  const user = await requireUser(db, userId);
  if (!user.isAdmin) {
    throw Object.assign(new Error('Admin privileges required'), { statusCode: 403 });
  }
  return user;
}

async function ensureIndexes(db) {
  await Promise.all([
    db.collection('binoculars').createIndex({ binocId: 1 }, { unique: true }),
    db.collection('binoculars').createIndex({ physicalId: 1 }, { unique: true }),
    db.collection('binocTransactions').createIndex({ borrowedAt: -1 }),
    db.collection('binocTransactions').createIndex(
      { binocId: 1 },
      { unique: true, partialFilterExpression: { returnedAt: null } }
    ),
  ]);
}

function publicBinocular(doc) {
  return {
    binocId: doc.binocId,
    make: doc.make,
    physicalId: doc.physicalId,
    addedAt: doc.addedAt,
    hash: doc.hash,
  };
}

function validateString(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw Object.assign(new Error(`${field} is required`), { statusCode: 400 });
  }
  return value.trim();
}

module.exports = {
  connectToDatabase,
  response,
  handleOptions,
  requireMethod,
  requireUser,
  requireAdmin,
  ensureIndexes,
  encryptBinocularPayload,
  decryptBinocularPayload,
  publicBinocular,
  validateString,
};
