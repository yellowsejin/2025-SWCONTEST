const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const axios     = require('axios');
const cors      = require('cors')({ origin: true });

module.exports.logout = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST')   return res.status(405).end();

    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      await admin.auth().revokeRefreshTokens(decoded.uid);
      res.json({ success: true });
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  });
});

