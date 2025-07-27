// functions/DeleteCategory.js
const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const cors      = require('cors')({ origin: true });

module.exports.deleteCategory = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { uid, categoryId } = req.body;
    if (!uid || !categoryId) {
      return res.status(400).json({ error: 'uid와 categoryId가 필요합니다.' });
    }

    try {
      await admin
        .firestore()
        .collection('users')
        .doc(uid)
        .collection('categories')
        .doc(categoryId)
        .delete();

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('카테고리 삭제 오류:', err);
      return res.status(500).json({ error: err.message });
    }
  });
});
