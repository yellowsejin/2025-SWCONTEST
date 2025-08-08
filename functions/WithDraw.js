// functions/WithDraw.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

if (!admin.apps.length) admin.initializeApp();

exports.withdraw = functions.https.onRequest(
  async (req, res) => {
    return cors(req, res, async () => {
      if (req.method === 'OPTIONS') return res.status(204).send('');
      if (req.method !== 'POST')    return res.status(405).json({ error: 'Method Not Allowed' });

      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: '로그인이 필요합니다.' });

      try {
        const { uid } = await admin.auth().verifyIdToken(idToken);
        await admin.auth().deleteUser(uid);
        await admin.firestore().collection('users').doc(uid).delete();
        return res.status(200).json({ success: true });
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    });
  }
);
