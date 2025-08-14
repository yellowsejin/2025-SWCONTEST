const functions = require('firebase-functions/v1');
const admin     = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp();
const db        = admin.firestore();

const runtimeOpts = {
  timeoutSeconds: 120,
  memory: '512MB'
};

function requiredCountFor(level) {
  if (level <= 5)  return 10;
  if (level <= 10) return 20;
  if (level <= 15) return 30;
  if (level <= 20) return 40;
  return 50;
}

const onUserCreate = functions
  .runWith(runtimeOpts)
  .auth
  .user()
  .onCreate(async (user) => {
    console.log('▶ onUserCreate fired for uid:', user.uid);
    const uid   = user.uid;

    try {
      await db.runTransaction(async (tx) => {
        const ref  = db.collection('users').doc(uid);
        const snap = await tx.get(ref);
        const cur  = snap.exists ? (snap.data() || {}) : {};

        // 기본값 계산
        const exists = (v) => v !== undefined && v !== null;
        const level  = exists(cur.level) ? cur.level : 1;
        const required =
          exists(cur.requiredTodoCount) ? cur.requiredTodoCount :
          exists(cur.nextThreshold)     ? cur.nextThreshold     :
          requiredCountFor(level);

        const upd = {};

        // 프로필류: 누락시만 채움
        if (!exists(cur.id) && user.displayName)  upd.id = user.displayName;
        if (!exists(cur.email) && user.email)     upd.email = user.email;

        // 친구가 세팅하려던 초기값들: 누락시만 채움
        if (!exists(cur.point))                   upd.point = 0;
        if (!exists(cur.level))                   upd.level = level;
        if (!exists(cur.questStatus))             upd.questStatus = {};

        // room.* 중첩 필드: 누락시만 채움 (dot notation)
        const hasRoom = typeof cur.room === 'object' && cur.room !== null;
        const hasTheme = hasRoom && cur.room.theme !== undefined;
        const hasFurniture = hasRoom && Array.isArray(cur.room.furniture);
        if (!hasTheme)      upd['room.theme'] = 'basic';
        if (!hasFurniture)  upd['room.furniture'] = [];

        // 카운터 3종: 누락시만 채움 (네가 signup에서 이미 넣었으면 그대로 둠)
        if (!exists(cur.totalCompletedCount)) upd.totalCompletedCount = 0;
        if (!exists(cur.completedCount))      upd.completedCount = 0;
        if (!exists(cur.nextThreshold))       upd.nextThreshold = required;
        if (!exists(cur.requiredTodoCount))   upd.requiredTodoCount = required;

        if (!exists(cur.createdAt)) {
          upd.createdAt = admin.firestore.FieldValue.serverTimestamp();
        }

        if (Object.keys(upd).length > 0) {
          tx.set(ref, upd, { merge: true }); // ✅ 절대 전체 덮어쓰지 않기
        }
      });

      console.log(`초기 데이터 세팅 완료 uid=${uid}`);
    } catch (err) {
      console.error(`초기 데이터 세팅 실패 uid=${uid} :`, err);
    }
  });

  module.exports = onUserCreate;