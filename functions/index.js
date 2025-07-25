const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const express = require('express');

admin.initializeApp();
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const app = express();
app.use(express.json());


const runtimeOpts = {
    timeoutSeconds: 120,
    memory: '512MB'
};


//auth trigger
const { user }  = require('firebase-functions');

exports.onUserCreate = functions
    .runWith(runtimeOpts)
    .auth
    .user()
    .onCreate(async (user) => {
        console.log('▶ onUserCreate fired for uid:', user.uid);

        const uid = user.uid;
        const email = user.email || null;
        const id = user.displayName || '';

        try {
            await db.collection('users').doc(uid).set({
                ID: id,
                email: email,
                createdAt: new Date(),
                point: 0,
                level: 1, 
                questStatus: {},
                room: {
                    theme: 'basic',
                    furniture: []
                }
            });

            console.log(`초기 데이터 세팅 유저 : ${uid}`);
        } catch (err) {
            console.error(`실패 ㅅㄱ염 ${uid} :`, err);
        }
        });

    

//레벨에 맞춰 잠금 해제된 가구 목록 반환
exports.getUnlockedFurnitures = functions
    .runWith(runtimeOpts)
    .https.onCall(async (data, context) => {
        //인증확인
        if(!context.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                '로그인이 필요합니다.'
            );
        }
        const uid = context.auth.uid;

        //유저 레벨 조회
        const userSnap = await db.collection('users').doc(uid).get();
        if (!userSnap.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                '사용자 데이터를 찾을 수 없습니다.'
            );
        }
        const { level } = userSnap.data();

        // unlockLevel ≤ level 인 가구 쿼리
        const furniSnap = await db
            .collection('furnitures')
            .where('unlockLevel', '<=', level)
            .orderBy('unlockLevel')
            .get();

        //결과반환
        return furniSnap.docs.map(doc => {
            const d = doc.data();
            return {
                id: doc.id,
                name: d.name,
                assetPath: d.assetPath,
                iconUrl: d.iconUrl,
                unlockLevel: d.unlockLevel,
                categoty: d.categoty,
                price: d.price //구매용 가격 필드 
            };
        });
    });


//포인트로 가구 구매 처리
exports.purchaseFurniture = functions
    .runWith(runtimeOpts)
    .https.onCall(async (data, context) => {
        if (!context.auth) {
                throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
            }
            const uid = context.auth.uid;
            const { furnitureId } = data;
            if (!furnitureId) {
                throw new functions.https.HttpsError('invalid-argument', '가구 ID를 전달해야 합니다?');
            }

            const userRef = db.collection('users').doc(uid);
            const furniRef = db.collection('furnitures').doc(furnitureId);

            //트랜잭션으로 포인트 차감 + 가구 소유 등록
            await db.runTransaction(async tx => {
                const userSnap = await tx.get(userRef);
                const furniSnap = await tx.get(furniRef);

                if (!userSnap.exists) {
                    throw new functions.https.HttpsError('not-found', '사용자 정보를 찾을 수 없습니다.');
                }
                if (!furniSnap.exists) {
                    throw new functions.https.HttpsError('not-found', '가구 정보를 찾을 수 없습니다?');
                }

                const userData = userSnap.data();
                const fData = furniSnap.data();
                const { point, level } = userData;
                const { unlockLevel, price } = fData;

                if (level < unlockLevel) {
                    throw new functions.https.HttpsError('failed-precondition', '해당 가구를 구매할 수 있는 레벨이 아닙니다.');
                }
                if (point < price) {
                    throw new functions.https.HttpsError('failed-precondition', '포인트가 부족합니다.');
                }

                //포인트 차감
                tx.update(userRef, { point: FieldValue.increment(-price) });
                //소유가구 서브컬렉션에 구매 이력 추가
                tx.set(userRef.collection('ownedFurnitures').doc(furnitureId), {
                    purchasedAt: new Date()
                });
            });

            return { success: true };
        });
    


//퀘스트 완료 시 보상(포인트) 지급
exports.completeQuest = functions
    .runWith({ timeoutSeconds: 60 })
    .https.onCall(async (data, context) => {
        //인증 체크
        /*if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
        }
        const uid = context.auth.uid;
        const { questId } = data;
        if (!questId) {
            throw new functions.https.HttpsError('invalid-argument', 'questId를 전달해야 합니다.');
        }

        //퀘스트 정보 로드(보상 포인트)
        const questRef = db.collection('quests').doc(questId);
        const questSnap = await questRef.get();
        if (!questSnap.exists) {
            throw new functions.https.HttpsError('not-found', '해당 퀘스트를 찾을 수 없습니다.');
        }
        const { rewardPoint } = questSnap.data();
        if (typeof rewardPoint !== 'number' || rewardPoint <= 0) {
            throw new functions.https.HttpsError('failed-precondition', '잘못된 보상 설정입니다.');
        } */

        const rewardPoint = 1;

        //트랜잭션으로 포인트 지급 + 완료 기록
        const userRef = db.collection('users').doc(uid);
        const statusRef = userRef.collection('questStatus').doc(questId);

        const result = await db.runTransaction(async tx => {
            const userSnap = await tx.get(userRef);
            if (!userSnap.exists) {
                throw new functions.https.HttpsError('not-found', '사용자 정보를 찾을 수 없습니다.');
            }

            //이미 지급된 퀘스트인지 중복체크
            const prevStatus = await tx.get(statusRef);
            if (prevStatus.exists && prevStatus.data().rewardGiven) {
                throw new functions.https.HttpsError('already-exists', '이미 보상을 받았습니다.');
            }

            //포인트 증가
            tx.update(userRef, {
                point: FieldValue.increment(rewardPoint)
            });
            //완료 기록 남기기
            tx.set(statusRef, {
                completeAt: admin.firestore.FieldValue.serverTimestamp(),
                rewardGiven: true,
                rewardPoint
            });

            //트랜잭션 최종 포인트(예시)
            const newPoint = (userSnap.data().point || 0) + rewardPoint;
            return { newPoint };
        });

        return {
            success: true,
            message: `퀘스트 ${questId} 완료, 1 포인트가 지급되었습니다.`,
            newPoint: result.newPoint
        };
    });



// --- 1. GET /checkUserRoom?uid=xxx ---
// 기능: uid에 해당하는 방이 존재하는지 확인
app.get('/checkUserRoon', async (req, res) => {
    const uid = req.query.uid;
    if (!uid) {
        return res.status(400).json({ error: 'uid query parameter is required' });
    }
    try {
        const roomDoc = await db.collection('rooms').doc(uid).get();
        return res.json({ status: roomDoc.exists ? 'exists' : 'not_exists' });
    } catch (err) {
        console.error('checkUserRoom error:', err);
        return res.status(500).json({ error: err.message });
    }
});

// --- 2. POST /onUserCreate ---
// 기능: uid 기준으로 방 최초 생성 (중복 방 생성 방지)
app.post('/onUserCreate', async (req, res) => {
    const userId = req.body.userId;
    if (!userId) {
        return res.status(400).json({ error: 'userId is required in request body' });
    }
    try {
        const roomRef = db.collection('rooms').doc(userId);
        const roomDoc = await roomRef.get();
        if (roomDoc.exists) {
            return res.status(400).json({ error: 'Room already exists for this uid' });
        }
        await roomRef.set({
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return res.json({ status: 'success' });
    } catch (err) {
        console.error('onUserCreate error:', err);
        return res.status(500).json({ error: err.message });
    }
});

//http 함수로 내보내기
exports.api = functions
    .runWith({
        timeoutSeconds: 300,
        memory: '512MB'
    })
    .https.onRequest(app);

    //친추
    exports.sendFriendRequest = functions
        .runWith(runtimeOpts)
        .https.onCall(async (data, context) => {
            if (!context.auth) throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
            const from = context.auth.uid;
            const to = data.toUid;
            if (!to) throw new functions.https.HttpsError('invalid-argument', 'toUid가 필요합니다.');

            //중복 방지 요청
            const dup = await db.collection('friendRequest')
                .where('from','==',from).where('to','==',to).where('status','==','pending')
                .get();
            if (!dup.empty) {
                throw new functions.https.HttpsError('already-exists', '이미 요청을 보냈습니다.');
            }

            await db.collection('friendRequests').add({
                from, to, status:'pending', createdAt: FieldValue.serverTimestamp()
            });
            return { success: true };
        });

    exports.respondFriendRequest = functions
        .runWith(runtimeOpts)
        .https.onCall(async (data, context) => {
            if (!context.auth) throw new functions.https.HttpsError('unauthenticated','로그인이 필요합니다.');
            const me = context.auth.uid;
            const requestId = data.requestId;
            const accept = data.accept;
            if (!requestId || typeof accept !== 'boolean') {
                throw new functions.https.HttpsError('invalid-argument', 'requestId와 accept(boolean)가 필요합니다.');
            }

            const reqRef = db.collection('friendRequests').doc(requestId);
            const reqSnap = await reqRef.get();
            if (!reqSnap.exists) throw new functions.https.HttpsError('not-found', '요청을 찾을 수 없습니다.');
            const { from, to, status } = reqSnap.data();
            if (to !== me) throw new functions.https.HttpsError('permission-denied', '내게 온 요청이 아닙니다.');
            if (status !== 'pending') throw new functions.https.HttpsError('failed-precondition', '이미 처리된 요청입니다.');

            if (accept) {
                //양 friends 배열에 추가
                const userRef = db.collection('users').doc(me);
                const otherRef = db.collection('users').doc(from);
                await db.runTransaction(async tx => {
                    tx.update(userRef, { friends: FieldValue.arrayUnion(from) });
                    tx.update(otherRef, { friends: FieldValue.arrayUnion(me) });
                    tx.update(reqRef, {status:'accepted' });
                });
                return { success:true, message:'친구가 되었습니다.' };
            } else {
                //거절처리
                await reqRef.update({ status:'rejected' });
                return { success:true, message:'친구 요청을 거절했습니다.' };
            }
        });