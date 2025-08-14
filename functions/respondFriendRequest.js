const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const respondFriendRequest = functions
  .runWith({ timeoutSeconds: 60, memory: "256MB" })
  .https.onCall(async (data, context) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
      }
      const uid = context.auth.uid;

      const requestId = data?.requestId;
      // action 문자열 또는 accept/reject 불리언 모두 허용
      let action = data?.action;
      if (!action) {
        if (data?.accept === true) action = "accept";
        else if (data?.accept === false || data?.reject === true) action = "reject";
      }
      if (!requestId || !["accept", "reject"].includes(String(action))) {
        throw new functions.https.HttpsError("invalid-argument", "requestId/action이 잘못됨");
      }

      const reqRef = db.collection("friendRequests").doc(requestId);

      await db.runTransaction(async (tx) => {
        const reqSnap = await tx.get(reqRef);
        if (!reqSnap.exists) {
          throw new functions.https.HttpsError("not-found", "요청 문서가 없음");
        }
        const req = reqSnap.data();

        // 스키마 호환: fromId/toId 또는 from/to 모두 지원
        const to   = req.toId   ?? req.to;
        const from = req.fromId ?? req.from;

        if (!to || !from) {
          throw new functions.https.HttpsError("failed-precondition", "요청 필드가 손상됨");
        }
        if (to !== uid) {
          throw new functions.https.HttpsError("permission-denied", "요청 대상이 아님");
        }
        if (req.status && req.status !== "pending") {
          return; // 이미 처리됨
        }

        if (action === "accept") {
          const meRef    = db.collection("users").doc(uid);
          const otherRef = db.collection("users").doc(from);

          // 양방향 친구 문서 생성 (서브컬렉션)
          tx.set(meRef.collection("friends").doc(from), {
            uid: from,
            createdAt: FieldValue.serverTimestamp(),
          });
          tx.set(otherRef.collection("friends").doc(uid), {
            uid,
            createdAt: FieldValue.serverTimestamp(),
          });

          tx.update(reqRef, {
            status: "accepted",
            respondedAt: FieldValue.serverTimestamp(),
          });
        } else {
          tx.update(reqRef, {
            status: "rejected",
            respondedAt: FieldValue.serverTimestamp(),
          });
        }
      });

      return { ok: true };
    } catch (err) {
      if (err instanceof functions.https.HttpsError) throw err;
      console.error("[respondFriendRequest]", err);
      throw new functions.https.HttpsError("internal", err?.message || "Internal error");
    }
  });

module.exports = respondFriendRequest;