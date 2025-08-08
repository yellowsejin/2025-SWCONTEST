// functions/addTodo.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

if (!admin.apps.length) admin.initializeApp();

exports.addTodo = functions.https.onRequest(
  async (req, res) => {
    return cors(req, res, async () => {
      if (req.method === 'OPTIONS') return res.status(204).send('');
      if (req.method !== 'POST')  return res.status(405).json({ error: 'Method Not Allowed' });

      const {
        uid,
        title,
        categoryId,
        startDate,
        endDate,
        repeat = 'none',
        isPublic = false,
        memo = ''
      } = req.body;

      if (!uid || !title || !categoryId || !startDate || !endDate) {
        return res.status(400).json({ error: 'uid, title, categoryId, startDate, endDate는 필수입니다.' });
      }

      try {
        const db      = admin.firestore();
        const todoRef = db
          .collection('users')
          .doc(uid)
          .collection('calendar')
          .doc();

        await todoRef.set({
          title,
          categoryId,
          startDate,
          endDate,
          repeat,
          isPublic,
          memo,
          completed: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return res.status(200).json({ success: true, id: todoRef.id });
      } catch (err) {
        console.error('투두 추가 오류:', err);
        return res.status(500).json({ error: err.message });
      }
    });
  }
);