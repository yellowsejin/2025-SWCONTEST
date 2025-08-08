const functions = require('firebase-functions/v1');
const admin     = require('firebase-admin');
const db        = admin.firestore();
const FieldValue = admin.firestore.FieldValue;


const completeQuest = functions
  .runWith({ timeoutSeconds: 60 })
  .https.onCall(async (data, context) => {
    // 1) 인증 체크
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    function getSeoulDate() {
      const now = new Date(Date.now() + 9 * 3600 * 1000); // 한국 시간으로 변환
      const y   = now.getUTCFullYear();
      const m   = String(now.getUTCMonth() + 1).padStart(2, '0');
      const d   = String(now.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`; // YYYY-MM-DD 형식
    }

    const today = getSeoulDate(); // 문자열 반환
    const uid     = context.auth.uid;
    const questId = data.questId;

    if (!questId) {
      throw new functions.https.HttpsError('invalid-argument', 'questId를 전달해야 합니다.');
    }

    const userRef      = db.collection('users').doc(uid);
    const statusRef    = userRef.collection('questStatus').doc(questId);
    const dailyRef     = userRef.collection('dailyQuests').doc(today);
    const date         = today; // ✅ 수정: today는 문자열이므로 그대로 사용

    // 트랜잭션으로 안전하게 처리
    const result = await db.runTransaction(async tx => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        throw new functions.https.HttpsError('not-found', '사용자 정보를 찾을 수 없습니다.');
      }

      const dailySnap = await tx.get(dailyRef);
      if (!dailySnap.exists) {
        throw new functions.https.HttpsError('failed-precondition', '오늘의 퀘스트가 생성되지 않았습니다.');
      }

      const todayIds = dailySnap.data().questIds;
      if (!Array.isArray(todayIds) || !todayIds.includes(questId)) {
        throw new functions.https.HttpsError('failed-precondition', '오늘 뽑힌 퀘스트가 아닙니다.');
      }

      const prevStatusSnap = await tx.get(statusRef);
      if (prevStatusSnap.exists && prevStatusSnap.data().rewardGiven) {
        throw new functions.https.HttpsError('already-exists', '이미 보상을 받았습니다.');
      }

      const rewardCoins = 5;
      tx.update(userRef, { point: FieldValue.increment(rewardCoins) });
      tx.set(statusRef, {
        completeAt: admin.firestore.FieldValue.serverTimestamp(),
        rewardGiven: true,
        rewardCoins
      });

      const newPoint = (userSnap.data().point || 0) + rewardCoins;
      return { newPoint };
    });

    return {
      success: true,
      message: `퀘스트 ${questId} 완료, ${result.newPoint} 포인트 보유.`,
      newPoint: result.newPoint
    };
  });

module.exports = completeQuest;