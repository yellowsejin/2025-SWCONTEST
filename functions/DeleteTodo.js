const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

if (!admin.apps.length) admin.initializeApp();

exports.deleteTodo = functions.https.onRequest(
  async (req, res) => {
    return cors(req, res, async () => {
      if (req.method === 'OPTIONS') return res.status(204).send('');
      if (req.method !== 'POST')  return res.status(405).json({ error: 'Method Not Allowed' });

      const { uid, todoId } = req.body;
      if (!uid || !todoId) {
        return res.status(400).json({ error: 'uid와 todoId는 필수입니다.' });
      }

      try {
        await admin.firestore()
          .collection('users')
          .doc(uid)
          .collection('calendar')
          .doc(todoId)
          .delete();
        return res.status(200).json({ success: true });
      } catch (err) {
        console.error('투두 삭제 오류:', err);
        return res.status(500).json({ error: err.message });
      }
    });
  }
);
