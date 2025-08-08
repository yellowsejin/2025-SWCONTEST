// functions/changePassword.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

if (!admin.apps.length) admin.initializeApp();

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{6,}$/;

exports.changePassword = functions.https.onRequest(
  async (req, res) => {
    return cors(req, res, async () => {
      if (req.method === 'OPTIONS') return res.status(204).send('');
      if (req.method !== 'POST')  return res.status(405).json({ error: 'Method Not Allowed' });

      const authHeader = req.headers.authorization || '';
      const idToken = authHeader.startsWith('Bearer ')
        ? authHeader.split('Bearer ')[1]
        : null;
      const { newPassword } = req.body;

      if (!idToken || !newPassword) {
        return res.status(400).json({ error: '인증 토큰과 새 비밀번호가 필요합니다.' });
      }
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({ error: '비밀번호는 최소 6자 이상, 영문+숫자 조합이어야 합니다.' });
      }

      try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        await admin.auth().updateUser(decoded.uid, { password: newPassword });
        return res.status(200).json({ success: true });
      } catch (err) {
        console.error('비밀번호 변경 오류:', err);
        const code = err.code || '';
        if (code === 'auth/argument-error') {
          return res.status(400).json({ error: '잘못된 요청입니다.' });
        }
        if (code === 'auth/id-token-expired' || code === 'auth/invalid-id-token') {
          return res.status(401).json({ error: '인증이 만료되었거나 유효하지 않습니다.' });
        }
        return res.status(500).json({ error: err.message });
      }
    });
  }
);