const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const axios     = require('axios');
const cors      = require('cors')({ origin: true });

module.exports.checkSession = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'GET')    return res.status(405).end();

    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      return res.json({ authenticated: false, uid: null });
    }
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      res.json({ authenticated: true, uid: decoded.uid });
    } catch {
      res.json({ authenticated: false, uid: null });
    }
  });
});