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

exports.completeTodo = functions.https.onRequest(async (req, res) => {
  return cors(req, res, async () => {
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST')   return res.status(405).json({ error: 'Method Not Allowed' });

    const { uid, todoId } = req.body;
    if (!uid || !todoId) return res.status(400).json({ error: 'uid, todoId가 필요합니다.' });

    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);
    const todoRef = userRef.collection('calendar').doc(todoId); // ← calendar 경로 사용

    try {
      const result = await db.runTransaction(async (tx) => {
        const [todoSnap, userSnap] = await Promise.all([tx.get(todoRef), tx.get(userRef)]);
        if (!todoSnap.exists) throw new Error('Todo not found');
        if (!userSnap.exists) throw new Error('User not found');

        const todo = todoSnap.data();
        const user = userSnap.data() || {};

        // 이미 완료된 투두면 카운트 증가하지 않음 (멱등성)
        if (todo.completed === true) {
          return {
            alreadyCompleted: true,
            level: user.level || 1,
            completedCount: user.completedCount || 0,
            totalCompletedCount: user.totalCompletedCount || 0,
            requiredTodoCount: user.requiredTodoCount || user.nextThreshold || requiredCountFor(user.level || 1)
          };
        }

        // 완료로 변경
        tx.update(todoRef, { completed: true });

        // 현재 값 로드(기본값 포함)
        let level = user.level || 1;
        let completedCount = user.completedCount || 0;       // 이번 레벨 완료 수
        let totalCompletedCount = user.totalCompletedCount || 0; // 누적 완료 수
        let required = user.requiredTodoCount || user.nextThreshold || requiredCountFor(level);

        // 카운트 증가
        completedCount += 1;
        totalCompletedCount += 1;

        // 레벨업 판정
        let leveledUp = false;
        if (completedCount >= required) {
          level += 1;
          completedCount = 0;
          required = requiredCountFor(level);
          leveledUp = true;
        }

        // 저장(호환 위해 둘 다 씀)
        tx.set(userRef, {
          level,
          completedCount,
          totalCompletedCount,
          requiredTodoCount: required,
          nextThreshold: required
        }, { merge: true });

        return { leveledUp, level, completedCount, totalCompletedCount, requiredTodoCount: required };
      });

      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  });
});
