const { initializeApp } = require('firebase-admin/app'); //admin SDK 초기화
const { getFirestore, FieldValue } = require('firebase-admin/firestore'); //firestore db(instance) 가져옴
const functions = require('firebase-functions/v1'); //api? 

const runtimeOpts = {
    timeoutSeconds: 120,
    memory: '512MB'
};

initializeApp();
const db = getFirestore();

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
        const name = user.displayName || 'New User';

        try {
            await db.collection('users').doc(uid).set({
                username: name,
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
        if (!context.auth) {
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
        }

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
                completeAt: new Date(),
                rewardGiven: true,
                rewardPoint
            });

            //트랜잭션 최종 포인트(예시)
            const newPoint = (userSnap.data().point || 0) + rewardPoint;
            return { newPoint };
        });

        return {
            success: true,
            message: `퀘스트 ${questId} 완료, ${rewardPoint} 포인트가 지급되었습니다.`,
            newPoint: result.newPoint
        };
    });