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
    const uid     = context.auth.uid;
    const questId = data.questId;
    if (!questId) {
      throw new functions.https.HttpsError('invalid-argument', 'questId를 전달해야 합니다.');
    }

    const userRef      = db.collection('users').doc(uid);
    const statusRef    = userRef.collection('questStatus').doc(questId);
    const today        = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
    const dailyRef     = userRef.collection('dailyQuests').doc(today);

    // 트랜잭션으로 안전하게 처리
    const result = await db.runTransaction(async tx => {
      // 유저 정보 로드
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        throw new functions.https.HttpsError('not-found', '사용자 정보를 찾을 수 없습니다.');
      }

      // 오늘 뽑힌 퀘스트 리스트 로드
      const dailySnap = await tx.get(dailyRef);
      if (!dailySnap.exists) {
        throw new functions.https.HttpsError('failed-precondition', '오늘의 퀘스트가 생성되지 않았습니다.');
      }
      const todayIds = dailySnap.data().questIds;
      if (!Array.isArray(todayIds) || !todayIds.includes(questId)) {
        throw new functions.https.HttpsError('failed-precondition', '오늘 뽑힌 퀘스트가 아닙니다.');
      }

      // 이미 보상 받은지 확인
      const prevStatusSnap = await tx.get(statusRef);
      if (prevStatusSnap.exists && prevStatusSnap.data().rewardGiven) {
        throw new functions.https.HttpsError('already-exists', '이미 보상을 받았습니다.');
      }

      // 보상 포인트: 5코인
      const rewardCoins = 5;
      // 포인트 업데이트
      tx.update(userRef, { point: FieldValue.increment(rewardCoins) });
      // 완료 상태 저장
      tx.set(statusRef, {
        completeAt: admin.firestore.FieldValue.serverTimestamp(),
        rewardGiven: true,
        rewardCoins
      });

      // 새로운 포인트 계산
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