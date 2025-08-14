// functions/UpdateTodo.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

if (!admin.apps.length) admin.initializeApp();

/**
 * 사용자의 calendar/{todoId} 문서 일부 필드 업데이트
 * 허용: title, categoryId, startDate, endDate, repeat, isPublic, memo
 * (⚠️ completed는 CompleteTodo 함수로만 변경하도록 여기서는 막음)
 */
exports.updateTodo = functions.https.onRequest(async (req, res) => {
  return cors(req, res, async () => {
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST')   return res.status(405).json({ error: 'Method Not Allowed' });

    const { uid, todoId, title, categoryId, startDate, endDate, repeat, isPublic, memo } = req.body;
    if (!uid || !todoId) return res.status(400).json({ error: 'uid, todoId는 필수입니다.' });

    // 업데이트 허용 필드만 추려 넣기
    const updateData = {};
    if (typeof title      !== 'undefined') updateData.title      = title;
    if (typeof categoryId !== 'undefined') updateData.categoryId = categoryId;
    if (typeof startDate  !== 'undefined') updateData.startDate  = startDate; // "YYYY-MM-DD" 문자열 그대로 사용
    if (typeof endDate    !== 'undefined') updateData.endDate    = endDate;   // 위와 동일
    if (typeof repeat     !== 'undefined') updateData.repeat     = repeat;    // 'none' | 'daily' | 'weekly' | 'monthly' 등
    if (typeof isPublic   !== 'undefined') updateData.isPublic   = !!isPublic;
    if (typeof memo       !== 'undefined') updateData.memo       = memo;

    // 변경할 값이 없을 때
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: '수정할 필드가 없습니다.' });
    }

    // 타임스탬프 추가
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    try {
      const db = admin.firestore();
      const ref = db.collection('users').doc(uid).collection('calendar').doc(todoId);
      await ref.update(updateData);

      // 수정 후 최신 문서도 같이 반환
      const snap = await ref.get();
      return res.status(200).json({ success: true, id: ref.id, data: snap.data() });
    } catch (err) {
      console.error('투두 수정 오류:', err);
      return res.status(500).json({ error: err.message });
    }
  });
});
