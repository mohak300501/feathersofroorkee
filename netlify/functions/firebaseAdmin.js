const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

let app;

if (getApps().length === 0) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
} else {
  app = getApps()[0];
}

const auth = getAuth(app);

const getAuthenticatedUser = async (event) => {
  const authorization =
    event.headers?.authorization ||
    event.headers?.Authorization ||
    '';

  if (!authorization.startsWith('Bearer '))
    return null;

  const idToken = authorization.slice(7);

  try {
    return await auth.verifyIdToken(idToken);
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    return null;
  }
};

const getAuthenticatedUserId = async (event) => {
  const decodedToken = await getAuthenticatedUser(event);
  return decodedToken?.uid || null;
};

module.exports = {
  auth,
  getAuthenticatedUser,
  getAuthenticatedUserId,
};