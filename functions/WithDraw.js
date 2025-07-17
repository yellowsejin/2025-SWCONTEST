// functions/WithDraw.js
const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const axios     = require('axios');
const cors      = require('cors')({ origin: true });

module.exports.withdraw = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST')   return res.status(405).end();

    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    try {
      const { uid } = await admin.auth().verifyIdToken(idToken);
      // users 컬렉션 및 하위 컬렉션 삭제 로직…
      await admin.auth().deleteUser(uid);
      await admin.firestore().collection('users').doc(uid).delete();
      // ownedFurnitures 같은 하위 컬렉션도 반복 삭제
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });
});
