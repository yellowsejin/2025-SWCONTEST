// src/api/quests.js
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

export async function fetchTodayQuests() {
  const callable = httpsCallable(functions, "getTodayQuest");
  const res = await callable();
  return res.data;
}

export async function completeQuest(questId) {
  const callable = httpsCallable(functions, "completeQuest");
  const res = await callable({ questId: String(questId) });
  return res.data;
}
