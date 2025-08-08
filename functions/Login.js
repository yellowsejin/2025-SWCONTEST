// functions/Login.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

if (!admin.apps.length) admin.initializeApp();

exports.login = functions.https.onRequest(
  async (req, res) => {
    return cors(req, res, async () => {
      if (req.method === 'OPTIONS') return res.status(204).send('');
      if (req.method !== 'POST')    return res.status(405).json({ error: 'Method Not Allowed' });

      const { email, password } = req.body;
      try {
        // Firebase Admin SDK에는 직접 비밀번호 인증 기능 없음
        // 일반적으로 프론트에서 signInWithEmailAndPassword로 로그인하고, 여기선 세션 확인/정보 반환용으로 활용
        const userRecord = await admin.auth().getUserByEmail(email);
        return res.status(200).json({ uid: userRecord.uid, email: userRecord.email });
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    });
  }
);
