// functions/CompleteTodo.js
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
    const todoRef = userRef.collection('calendar').doc(todoId);

    try {
      const result = await db.runTransaction(async (tx) => {
        const [todoSnap, userSnap] = await Promise.all([tx.get(todoRef), tx.get(userRef)]);
        if (!todoSnap.exists) throw new Error('Todo not found');
        if (!userSnap.exists) throw new Error('User not found');

        const todo = todoSnap.data() || {};
        const user = userSnap.data() || {};

        // 이미 완료 + 이미 집계되었다면 아무 것도 하지 않음(멱등)
        if (todo.completed === true && !!todo.countedAt) {
          const level = user.level || 1;
          const completedCount = user.completedCount || 0;
          const totalCompletedCount = user.totalCompletedCount || 0;
          const requiredTotal = user.requiredTodoCount != null
            ? (user.completedCount != null ? user.requiredTodoCount + completedCount : requiredCountFor(level))
            : requiredCountFor(level);
          const remaining = requiredTotal - completedCount;
          return { leveledUp: false, level, completedCount, totalCompletedCount, requiredTodoCount: remaining };
        }
      

        // 1) 투두 완료로 전환 + 집계 마킹
        tx.update(todoRef, {
          completed: true,
          countedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 2) 카운터 계산
        let level = user.level || 1;
        let completedCount = user.completedCount || 0;            // 현재 레벨에서 완료한 개수
        let totalCompletedCount = user.totalCompletedCount || 0;  // 누적 완료 개수
        let requiredTotal = requiredCountFor(level);              // 현재 레벨에서 필요한 총 개수

        completedCount += 1;
        totalCompletedCount += 1;

        // 레벨업 판정
        let leveledUp = false;
        if (completedCount >= requiredTotal) {
          level += 1;
          completedCount = 0;                       // 새 레벨 시작
          requiredTotal = requiredCountFor(level);  // 새 레벨의 총 필요량
          leveledUp = true;
        }

        // "남은 개수"로 저장
        const remaining = requiredTotal - completedCount;

        tx.set(userRef, {
          level,
          completedCount,
          totalCompletedCount,
          requiredTodoCount: remaining  // ← 남은 개수로 유지
        }, { merge: true });

        return { leveledUp, level, completedCount, totalCompletedCount, requiredTodoCount: remaining };
      });

      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  });
});
