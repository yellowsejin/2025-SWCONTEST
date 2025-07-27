// functions/AddCategory.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

module.exports.addCategory = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Preflight
    if (req.method === 'OPTIONS') return res.status(204).send('');

    // POST 외에는 거절
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { uid, name, color } = req.body;

    // 유효성 검사
    if (!uid || !name || !color) {
      return res.status(400).json({ error: 'uid, name, color는 필수입니다.' });
    }

    try {
      const categoryRef = admin
        .firestore()
        .collection('users')
        .doc(uid)
        .collection('categories')
        .doc(); // 자동 ID

      await categoryRef.set({
        name,
        color,
        isPublic: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(200).json({ success: true, id: categoryRef.id });
    } catch (err) {
      console.error('카테고리 추가 오류:', err);
      return res.status(500).json({ error: err.message });
    }
  });
});
