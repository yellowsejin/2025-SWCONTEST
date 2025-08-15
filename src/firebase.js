// src/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

// 🔧 배포 리전(us-central1)에 맞춰 Functions 인스턴스 생성
const FIREBASE_REGION = "us-central1";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MSG_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
};

// ✅ HMR/중복 방지: 이미 초기화돼 있으면 재사용
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Firebase 인스턴스들
export const auth = getAuth(app);

// ✅ Firestore: 네트워크 환경(학교/사내망 등)에서 WebChannel 막힘 대응
//    - long polling 강제
//    - fetch streams 비활성
//    - 로컬 캐시(멀티 탭 안전)
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

export const functions = getFunctions(app, FIREBASE_REGION);

// ── 헬퍼들 ─────────────────────────────────────────────
export const onAuth = (cb) => onAuthStateChanged(auth, cb);

export const devLogin = async () => {
  const email = import.meta.env.VITE_DEV_EMAIL;
  const pass = import.meta.env.VITE_DEV_PASS;
  if (email && pass) {
    await signInWithEmailAndPassword(auth, email, pass);
  }
};

// ── Callable Functions ────────────────────────────────
export const callGetTodayQuest = httpsCallable(functions, "getTodayQuest");
export const callCompleteQuest = httpsCallable(functions, "completeQuest");

// app 자체도 필요하면 사용 가능
export { app };
