const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const completeQuest = functions
  .runWith({ timeoutSeconds: 60 })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    const questId = data?.questId;
    if (!questId) {
      throw new functions.https.HttpsError("invalid-argument", "questId를 전달해야 합니다.");
    }

    const uid = context.auth.uid;

    // 한국 시간 YYYY-MM-DD
    const today = (() => {
      const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
      const y = now.getUTCFullYear();
      const m = String(now.getUTCMonth() + 1).padStart(2, "0");
      const d = String(now.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    })();

    const userRef  = db.collection("users").doc(uid);
    const dailyRef = userRef.collection("dailyQuests").doc(today);
    const questRef = db.collection("quests").doc(questId);

    const { added, newPoint } = await db.runTransaction(async (tx) => {
      const [userSnap, dailySnap, qSnap] = await Promise.all([
        tx.get(userRef),
        tx.get(dailyRef),
        tx.get(questRef),
      ]);

      if (!userSnap.exists) {
        throw new functions.https.HttpsError("not-found", "사용자 정보를 찾을 수 없습니다.");
      }
      if (!dailySnap.exists) {
        throw new functions.https.HttpsError("failed-precondition", "오늘의 퀘스트가 생성되지 않았습니다.");
      }

      const dailyData = dailySnap.data() || {};
      const todayIds  = dailyData.questIds || [];
      if (!todayIds.includes(questId)) {
        throw new functions.https.HttpsError("failed-precondition", "오늘 뽑힌 퀘스트가 아닙니다.");
      }

      // ✅ 맵 필드(status)에서 중복 보상 체크
      const statusMap = dailyData.status || {};
      if (statusMap[questId]?.rewardGiven) {
        throw new functions.https.HttpsError("already-exists", "이미 보상을 받았습니다.");
      }

      const rewardCoins = qSnap.data()?.rewardCoins ?? 5;

      // 포인트 증가
      tx.update(userRef, { point: FieldValue.increment(rewardCoins) });

      // ✅ status 맵에 기록 (merge)
      tx.set(
        dailyRef,
        {
          status: {
            [questId]: {
              rewardGiven: true,
              rewardCoins,
              completeAt: admin.firestore.FieldValue.serverTimestamp(),
            },
          },
          // 선택: 완료 카운트 집계
          completedCount: FieldValue.increment(1),
        },
        { merge: true }
      );

      const newPoint = (userSnap.data().point || "") + rewardCoins;
      return { added: rewardCoins, newPoint };
    });

    return { success: true, added, newPoint };
  });

module.exports = completeQuest;