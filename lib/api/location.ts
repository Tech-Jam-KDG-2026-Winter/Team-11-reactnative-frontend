import { supabase } from "../supabase";
import type { EncounterWithQuests, CompletedQuest } from "./types";

/**
 * 現在の位置情報を Supabase に記録
 */
export async function recordLocation(
  latitude: number,
  longitude: number,
  accuracy?: number
): Promise<void> {
  // ログイン状態をチェック
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // 未ログイン時は静かにスキップ
    console.log("未ログインのため位置情報送信をスキップ");
    return;
  }

  const { error } = await supabase.rpc("record_location", {
    p_lat: latitude,
    p_lon: longitude,
    p_accuracy_m: accuracy != null ? Math.round(accuracy) : null,
    p_recorded_at: new Date().toISOString(),
  });

  if (error) {
    console.error("位置情報の記録に失敗:", error);
    throw new Error(`位置情報の記録に失敗: ${error.message}`);
  }
}

/**
 * 自分のすれ違い一覧を取得（相手のユーザー情報とクエスト情報を含む）
 */
export async function getMyEncounters(): Promise<EncounterWithQuests[]> {
  // まず my_encounters view から基本情報を取得
  const { data: encounters, error: encountersError } = await supabase
    .from("my_encounters")
    .select("*")
    .order("last_seen_at", { ascending: false });

  if (encountersError) {
    console.error("すれ違い情報の取得に失敗:", encountersError);
    throw new Error(`すれ違い情報の取得に失敗: ${encountersError.message}`);
  }

  if (!encounters || encounters.length === 0) {
    return [];
  }

  // 相手のユーザーIDリストを取得
  const otherUserIds = encounters.map((e) => e.other_user_id);

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("uuid, display_name, avatar_url")
    .in("uuid", otherUserIds);

  if (usersError) {
    console.error("ユーザー情報の取得に失敗:", usersError);
    // ユーザー情報が取れなくても続行
  }

  // ユーザー情報をマップ化
  const userMap = new Map(
    users?.map((user) => [
      user.uuid,
      {
        display_name: user.display_name ?? null,
        avatar_url: user.avatar_url ?? null,
      },
    ]) ?? []
  );

  // 今日の日付（YYYY-MM-DD形式）
  const today = new Date().toISOString().split("T")[0];

  // 各すれ違いに対して、相手の今日完了したクエストを取得
  const encountersWithQuests: EncounterWithQuests[] = await Promise.all(
    encounters.map(async (encounter) => {
      const otherUserProfile = userMap.get(encounter.other_user_id);
      // 相手の今日完了したクエストを取得
      const { data: quests, error: questsError } = await supabase
        .from("quests")
        .select("id, title, description, updated_at")
        .eq("uuid", encounter.other_user_id)
        .eq("completed", true)
        .eq("day", today)
        .order("updated_at", { ascending: false });

      if (questsError) {
        console.error(
          `ユーザー ${encounter.other_user_id} のクエスト取得に失敗:`,
          questsError
        );
      }

      const completedQuests: CompletedQuest[] =
        quests?.map((q) => ({
          id: q.id,
          title: q.title,
          description: q.description ?? null,
          completed_at: q.updated_at,
        })) ?? [];

      return {
        id: encounter.id,
        other_user_id: encounter.other_user_id,
        other_user_name:
          encounter.other_user_name ?? otherUserProfile?.display_name ?? null,
        other_user_avatar:
          encounter.other_user_avatar ?? otherUserProfile?.avatar_url ?? null,
        started_at: encounter.started_at,
        last_seen_at: encounter.last_seen_at,
        ended_at: encounter.ended_at,
        seen_minutes: encounter.seen_minutes,
        min_distance_m: encounter.min_distance_m,
        last_distance_m: encounter.last_distance_m,
        completed_quests: completedQuests,
      };
    })
  );

  return encountersWithQuests;
}
