import { apiRequest } from "./client";
import type { Quest } from "./types";

/**
 * 当日分のクエストを取得する（表示用にあいうえお順で返す）
 */
export async function getTodayQuests(userUuid: string): Promise<Quest[]> {
  const data = await apiRequest<Quest[]>("/api/quests/get", {
    method: "GET",
    userUuid,
  });
  return data.slice().sort((a, b) => a.title.localeCompare(b.title, "ja"));
}

/**
 * クエストの完了状態をトグルする
 */
export async function toggleQuestComplete(
  userUuid: string,
  questId: number
): Promise<Quest> {
  return apiRequest<Quest>(`/api/quests/${questId}/complete`, {
    method: "POST",
    userUuid,
  });
}

interface AdoptEncounterQuestRequest {
  title: string;
  description?: string;
  source_user_uuid: string;
  source_user_name?: string | null;
  source_quest_id: number;
  source_encounter_id?: number | null;
}

interface AdoptEncounterQuestResponse {
  created: boolean;
  quest: Quest;
}

/**
 * すれ違いユーザーのクエストを自分の今日のクエストとして追加する
 */
export async function adoptEncounterQuest(
  userUuid: string,
  payload: AdoptEncounterQuestRequest
): Promise<AdoptEncounterQuestResponse> {
  return apiRequest<AdoptEncounterQuestResponse>("/api/quests/adopt", {
    method: "POST",
    userUuid,
    body: payload,
  });
}
