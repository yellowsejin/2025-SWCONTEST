// functions/checkSession.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

if (!admin.apps.length) admin.initializeApp();

exports.checkSession = functions.https.onRequest(
  { region: 'us-central1' },
  async (req, res) => {
    return cors(req, res, async () => {
      if (req.method === 'OPTIONS') return res.status(204).end();
      if (req.method !== 'GET')    return res.status(405).end();

      const authHeader = req.headers.authorization || '';
      const idToken = authHeader.startsWith('Bearer ')
        ? authHeader.split('Bearer ')[1]
        : null;
      if (!idToken) {
        return res.json({ authenticated: false, uid: null });
      }
      try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        return res.json({ authenticated: true, uid: decoded.uid });
      } catch {
        return res.json({ authenticated: false, uid: null });
      }
    });
  }
);