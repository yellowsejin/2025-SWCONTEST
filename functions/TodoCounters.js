// 팀 스타일 유지(다른 파일과 동일한 require)
const functions = require('firebase-functions');
// ✅ v2 임포트: 트리거와 글로벌옵션 분리 경로
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { setGlobalOptions }  = require('firebase-functions/v2');

const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// (선택) 리전/리소스 설정
setGlobalOptions({ region: 'us-central1', memory: '256MiB', timeoutSeconds: 60 });

function requiredCountFor(level) {
  if (level <= 5)  return 10;
  if (level <= 10) return 20;
  if (level <= 15) return 30;
  if (level <= 20) return 40;
  return 50;
}

async function bumpCounters(uid, todoRef) {
  await db.runTransaction(async (tx) => {
    const userRef = db.collection('users').doc(uid);
    const [userSnap, todoSnap] = await Promise.all([tx.get(userRef), tx.get(todoRef)]);
    if (!userSnap.exists || !todoSnap.exists) return;

    const todo = todoSnap.data() || {};
    if (todo.completionCounted) return; // 중복 집계 방지

    const u = userSnap.data() || {};
    let level   = u.level || 1;
    let doneLv  = u.completedCount || 0;       // 이번 레벨 완료
    let doneAll = u.totalCompletedCount || 0;  // 누적 완료
    let req     = u.requiredTodoCount || requiredCountFor(level);

    doneLv  += 1;
    doneAll += 1;

    if (doneLv >= req) {
      level += 1;
      doneLv = 0;
      req = requiredCountFor(level);
    }

    tx.set(userRef, {
      level,
      completedCount: doneLv,
      totalCompletedCount: doneAll,
      requiredTodoCount: req
    }, { merge: true });

    tx.update(todoRef, {
      completionCounted: admin.firestore.FieldValue.serverTimestamp()
    });
  });
}

// ✅ 생성/수정 한 방에 처리
exports.todoCounters = onDocumentWritten('users/{uid}/calendar/{todoId}', async (event) => {
  // 삭제는 무시
  if (!event.data?.after) return;

  const before = event.data.before?.data() || {};
  const after  = event.data.after.data() || {};

  const beforeDone = !!before.completed || before.status === 'done';
  const afterDone  = !!after.completed  || after.status  === 'done';

  // 완료 상태가 된 경우만(처음부터 완료 or false->true)
  if (!afterDone) return;
  if (event.data.before && beforeDone) return; // 이미 완료였던 업데이트는 스킵

  const { uid, todoId } = event.params;
  const todoRef = db.collection('users').doc(uid).collection('calendar').doc(todoId);
  await bumpCounters(uid, todoRef);
});
