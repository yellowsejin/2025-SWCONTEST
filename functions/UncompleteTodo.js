// functions/UncompleteTodo.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

if (!admin.apps.length) admin.initializeApp();

function requiredCountFor(level) {
  if (level <= 5)  return 10;
  if (level <= 10) return 20;
  if (level <= 15) return 30;
  if (level <= 20) return 40;
  return 50;
}

exports.uncompleteTodo = functions.https.onRequest(async (req, res) => {
  return cors(req, res, async () => {
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST')   return res.status(405).json({ error: 'Method Not Allowed' });

    const { uid, todoId } = req.body;
    if (!uid || !todoId) return res.status(400).json({ error: 'uid, todoId가 필요합니다.' });

    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);
    const todoRef = userRef.collection('calendar').doc(todoId);

    try {
      const result = await db.runTransaction(async (tx) => {
        const [todoSnap, userSnap] = await Promise.all([tx.get(todoRef), tx.get(userRef)]);
        if (!todoSnap.exists) throw new Error('Todo not found');
        if (!userSnap.exists) throw new Error('User not found');

        const todo = todoSnap.data() || {};
        const user = userSnap.data() || {};

        // 이미 미완료면 멱등 처리
        if (!todo.completed) {
          const level = user.level || 1;
          const completedCount = user.completedCount || 0;
          const totalCompletedCount = user.totalCompletedCount || 0;
          const remaining = requiredCountFor(level) - completedCount;
          return { leveledDown: false, level, completedCount, totalCompletedCount, requiredTodoCount: remaining };
        }

        // 완료 취소: completed=false
        const update = { completed: false };
        // 집계됐던 항목만 카운터 되돌림 (countedAt 플래그가 있을 때만)
        const wasCounted = !!todo.countedAt;
        if (wasCounted) update.countedAt = admin.firestore.FieldValue.delete();
        tx.update(todoRef, update);

        let level = user.level || 1;
        let completedCount = user.completedCount || 0;
        let totalCompletedCount = user.totalCompletedCount || 0;

        let leveledDown = false;

        if (wasCounted) {
          // 누적은 최소 0 보장
          totalCompletedCount = Math.max(0, totalCompletedCount - 1);

          if (completedCount > 0) {
            completedCount -= 1;
          } else {
            // 이번 레벨에서 0인데 하나를 되돌리는 경우 → 이전 레벨에서 막 레벨업 했던 건으로 판단하고 되돌림
            if (level > 1) {
              level -= 1;
              completedCount = requiredCountFor(level) - 1; // 이전 레벨에서 하나 모자란 상태
              leveledDown = true;
            } else {
              completedCount = 0; // 레벨 1이면 더 내려갈 수 없음
            }
          }
        }

        const remaining = requiredCountFor(level) - completedCount;

        tx.set(userRef, {
          level,
          completedCount,
          totalCompletedCount,
          requiredTodoCount: remaining
        }, { merge: true });

        return { leveledDown, level, completedCount, totalCompletedCount, requiredTodoCount: remaining };
      });

      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  });
});
