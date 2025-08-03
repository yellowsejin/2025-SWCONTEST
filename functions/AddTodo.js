// functions/AddTodo.js
const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const cors      = require('cors')({ origin: true });

module.exports.addTodo = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method === 'OPTIONS') 
      return res.status(204).send('');
    if (req.method !== 'POST') 
      return res.status(405).json({ error: 'Method Not Allowed' });

    const {
      uid,
      title,
      categoryId,
      startDate,         // "yyyy-MM-dd" 또는 ISO 문자열
      endDate,           // 기간의 끝
      repeat = 'none',   // 'none'|'daily'|'weekly'|'biweekly'|'monthly'
      isPublic = false,  // 공개 여부
      memo = ''
    } = req.body;

    if (!uid || !title || !categoryId || !startDate || !endDate) {
      return res
        .status(400)
        .json({ error: 'uid, title, categoryId, startDate, endDate는 필수입니다.' });
    }

    try {
      const db = admin.firestore();
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
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(200).json({ success: true, id: todoRef.id });
    } catch (err) {
      console.error('투두 추가 오류:', err);
      return res.status(500).json({ error: err.message });
    }
  });
});
