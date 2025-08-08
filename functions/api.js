const express = require('express');
const cors    = require('cors');
const admin   = require('firebase-admin');
const db      = admin.firestore();

const router = express();
router.use(cors({ origin: true }));
router.use(express.json());

// 1) GET /checkUserRoom
router.get('/checkUserRoom', async (req, res) => {
  const uid = req.query.uid;
  if (!uid) return res.status(400).json({ error: 'uid 필요' });
  try {
    const roomDoc = await db.collection('rooms').doc(uid).get();
    res.json({ status: roomDoc.exists ? 'exists' : 'not_exists' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2) POST /onUserCreate
router.post('/onUserCreate', async (req, res) => {
  const userId = req.body.userId;
  if (!userId) return res.status(400).json({ error: 'userId 필요' });
  try {
    const roomRef = db.collection('rooms').doc(userId);
    const roomDoc = await roomRef.get();
    if (roomDoc.exists) {
      return res.status(400).json({ error: '이미 방이 존재합니다.' });
    }
    await roomRef.set({ createdAt: admin.firestore.FieldValue.serverTimestamp() });
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;