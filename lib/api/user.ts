import { supabase } from "../supabase";

export interface MyProfile {
  uuid: string;
  display_name: string | null;
  avatar_url: string | null;
}

/**
 * 自分のプロフィールを public.users から取得
 */
export async function getMyProfile(): Promise<MyProfile | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("認証情報の取得に失敗:", authError);
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("uuid, display_name, avatar_url")
    .eq("uuid", user.id)
    .single();

  if (error) {
    console.error("プロフィールの取得に失敗:", error);
    return null;
  }

  return data as MyProfile;
}

/**
 * 自分のアバターURLを更新
 * @param avatarUrl 新しいアバターURL。空文字の場合は NULL に更新
 */
export async function updateMyAvatar(avatarUrl: string): Promise<void> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("認証情報の取得に失敗しました");
  }

  const { error } = await supabase
    .from("users")
    .update({
      avatar_url: avatarUrl.trim() === "" ? null : avatarUrl.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("uuid", user.id);

  if (error) {
    console.error("アバターの更新に失敗:", error);
    throw new Error(`アバターの更新に失敗: ${error.message}`);
  }
}

const DISPLAY_NAME_MAX_LENGTH = 100;

/**
 * 自分の表示名を更新（public.users と Auth の user_metadata の両方を更新）
 * @param displayName 新しい表示名。空文字の場合は null に更新。最大100文字。
 */
export async function updateMyDisplayName(displayName: string): Promise<void> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("認証情報の取得に失敗しました");
  }

  const value =
    displayName.trim() === ""
      ? null
      : displayName.trim().slice(0, DISPLAY_NAME_MAX_LENGTH);

  const { error } = await supabase
    .from("users")
    .update({
      display_name: value,
      updated_at: new Date().toISOString(),
    })
    .eq("uuid", user.id);

  if (error) {
    console.error("表示名の更新に失敗:", error);
    throw new Error(`表示名の更新に失敗: ${error.message}`);
  }

  const { error: authUpdateError } = await supabase.auth.updateUser({
    data: { display_name: value },
  });

  if (authUpdateError) {
    console.error("Auth user_metadata の更新に失敗:", authUpdateError);
    throw new Error(`表示名の更新に失敗: ${authUpdateError.message}`);
  }
}

/**
 * 性格設定（タグと自由入力）を更新（mascotsテーブル）
 * @param tags 性格タグ（最大5個）
 * @param note 自由入力（最大200文字）
 */
export async function updateMyPersonality(
  tags: string[],
  note: string | null
): Promise<void> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("認証情報の取得に失敗しました");
  }

  // バリデーション
  const validatedTags = tags.slice(0, 5);
  const validatedNote = note ? note.slice(0, 200) : null;

  // mascotsテーブルに既存レコードがあるか確認
  const { data: existing } = await supabase
    .from("mascots")
    .select("id")
    .eq("uuid", user.id)
    .limit(1);

  if (existing && existing.length > 0) {
    // 既存レコードを更新
    const { error } = await supabase
      .from("mascots")
      .update({
        personality_tags: validatedTags,
        personality_note: validatedNote?.trim() === "" ? null : validatedNote,
        updated_at: new Date().toISOString(),
      })
      .eq("uuid", user.id);

    if (error) {
      console.error("性格設定の更新に失敗:", error);
      throw new Error(`性格設定の更新に失敗: ${error.message}`);
    }
  } else {
    // 新規レコードを作成
    const { error } = await supabase.from("mascots").insert({
      uuid: user.id,
      status: "Okay",
      message: "はじめまして！",
      personality_tags: validatedTags,
      personality_note: validatedNote?.trim() === "" ? null : validatedNote,
    });

    if (error) {
      console.error("性格設定の作成に失敗:", error);
      throw new Error(`性格設定の作成に失敗: ${error.message}`);
    }
  }
}

export interface MascotPersonality {
  personality_tags: string[];
  personality_note: string | null;
}

/**
 * マスコットの性格設定を取得
 */
export async function getMyPersonality(): Promise<MascotPersonality | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("認証情報の取得に失敗:", authError);
    return null;
  }

  const { data, error } = await supabase
    .from("mascots")
    .select("personality_tags, personality_note")
    .eq("uuid", user.id)
    .limit(1);

  if (error) {
    console.error("性格設定の取得に失敗:", error);
    return null;
  }

  if (data && data.length > 0) {
    return {
      personality_tags: data[0].personality_tags ?? [],
      personality_note: data[0].personality_note ?? null,
    };
  }

  return { personality_tags: [], personality_note: null };
}
