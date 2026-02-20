import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";

import { GrassBackground } from "@/components/grass-background";
import { AccountCard } from "@/components/settings/AccountCard";
import { DebugNotificationsCard } from "@/components/settings/DebugNotificationsCard";
import { DebugSettingsCard } from "@/components/settings/DebugSettingsCard";
import { LogoutButton } from "@/components/settings/LogoutButton";
import { PersonalitySection } from "@/components/settings/PersonalitySection";
import { useAuth } from "@/hooks/use-auth";
import {
  getMyProfile,
  updateMyAvatar,
  updateMyDisplayName,
  updateMyPassword,
  updateMyPersonality,
  getMyPersonality,
} from "@/lib/api";

// マスコット性格タグのプリセット候補
const PERSONALITY_TAGS = [
  "優しい",
  "元気いっぱい",
  "おっとり",
  "クール",
  "甘えん坊",
  "しっかり者",
  "天然",
  "ツンデレ",
  "励まし上手",
  "おちゃめ",
  "癒し系",
  "熱血",
] as const;

const MAX_PERSONALITY_TAGS = 5;
const MAX_PERSONALITY_NOTE_LENGTH = 200;

const DEBUG_SKIP_QUESTIONNAIRE_LIMIT_KEY = "debug:skipQuestionnaireLimit";
const DEBUG_SHOW_ENCOUNTERS_WITHOUT_NIGHT_KEY = "debug:showEncountersWithoutNight";

const getDebugSkipLimit = async (): Promise<boolean> => {
  try {
    const raw = await AsyncStorage.getItem(DEBUG_SKIP_QUESTIONNAIRE_LIMIT_KEY);
    return raw === "true";
  } catch {
    return false;
  }
};

const setDebugSkipLimit = async (value: boolean) => {
  try {
    await AsyncStorage.setItem(DEBUG_SKIP_QUESTIONNAIRE_LIMIT_KEY, String(value));
  } catch {
    // エラーは無視
  }
};

const getDebugShowEncountersWithoutNight = async (): Promise<boolean> => {
  try {
    const raw = await AsyncStorage.getItem(DEBUG_SHOW_ENCOUNTERS_WITHOUT_NIGHT_KEY);
    return raw === "true";
  } catch {
    return false;
  }
};

const setDebugShowEncountersWithoutNight = async (value: boolean) => {
  try {
    await AsyncStorage.setItem(DEBUG_SHOW_ENCOUNTERS_WITHOUT_NIGHT_KEY, String(value));
  } catch {
    // エラーは無視
  }
};

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut, session } = useAuth();
  const [skipQuestionnaireLimit, setSkipQuestionnaireLimit] = useState(false);
  const [showEncountersWithoutNight, setShowEncountersWithoutNight] = useState(false);
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [avatarUrlInput, setAvatarUrlInput] = useState("");
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // 性格設定用のstate
  const [personalityTags, setPersonalityTags] = useState<string[]>([]);
  const [personalityNote, setPersonalityNote] = useState("");
  const [isSavingPersonality, setIsSavingPersonality] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const profile = await getMyProfile();
      const displayName = profile?.display_name ?? null;
      const avatarUrl = profile?.avatar_url ?? null;
      setProfileDisplayName(displayName);
      setProfileAvatarUrl(avatarUrl);
      setDisplayNameInput(displayName ?? "");
      setAvatarUrlInput(avatarUrl ?? "");
    } catch (error) {
      console.error("プロフィールの取得に失敗:", error);
    }
  }, []);

  const loadPersonality = useCallback(async () => {
    try {
      const personality = await getMyPersonality();
      setPersonalityTags(personality?.personality_tags ?? []);
      setPersonalityNote(personality?.personality_note ?? "");
    } catch (error) {
      console.error("性格設定の取得に失敗:", error);
    }
  }, []);

  useEffect(() => {
    const loadDebugSettings = async () => {
      const skipLimit = await getDebugSkipLimit();
      const showEncounters = await getDebugShowEncountersWithoutNight();
      setSkipQuestionnaireLimit(skipLimit);
      setShowEncountersWithoutNight(showEncounters);
    };
    loadDebugSettings();
  }, []);

  useEffect(() => {
    if (session?.user) {
      loadProfile();
      loadPersonality();
    }
  }, [session?.user, loadProfile, loadPersonality]);

  const handleToggleSkipLimit = async (value: boolean) => {
    await setDebugSkipLimit(value);
    setSkipQuestionnaireLimit(value);
    Alert.alert(
      value ? "有効化" : "無効化",
      value
        ? "アンケートの回答制限がスキップされました"
        : "アンケートの回答制限が有効になりました"
    );
  };

  const handleToggleShowEncounters = async (value: boolean) => {
    await setDebugShowEncountersWithoutNight(value);
    setShowEncountersWithoutNight(value);
    Alert.alert(
      value ? "有効化" : "無効化",
      value
        ? "夜のアンケートを答えなくてもすれ違いを見れるようになりました"
        : "夜のアンケート完了が必要になりました"
    );
  };

  const handleDebugNotification = async (type: "morning" | "night") => {
    const content =
      type === "morning"
        ? {
            title: "おはようございます！☀️",
            body: "朝の記録をしましょう。今の気分はどうですか？",
            data: { type: "morning" },
          }
        : {
            title: "お疲れ様でした！🌙",
            body: "夜の記録をしましょう。今日はどんな一日でしたか？",
            data: { type: "night" },
          };

    try {
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: null,
      });
    } catch {
      Alert.alert("通知エラー", "通知の送信に失敗しました");
    }
  };

  const handleSaveAccount = async () => {
    setIsSavingAccount(true);
    try {
      await updateMyDisplayName(displayNameInput);
      await updateMyAvatar(avatarUrlInput);
      await loadProfile();
    } catch {
      Alert.alert("エラー", "アカウント情報の保存に失敗しました");
    } finally {
      setIsSavingAccount(false);
    }
  };

  const MIN_PASSWORD_LENGTH = 6;

  const handleSavePassword = async () => {
    if (newPasswordInput !== confirmPasswordInput) {
      Alert.alert("入力エラー", "パスワードが一致しません。");
      return;
    }
    if (newPasswordInput.length < MIN_PASSWORD_LENGTH) {
      Alert.alert(
        "入力エラー",
        `パスワードは${MIN_PASSWORD_LENGTH}文字以上で入力してください。`
      );
      return;
    }
    setIsSavingPassword(true);
    try {
      await updateMyPassword(newPasswordInput);
      setNewPasswordInput("");
      setConfirmPasswordInput("");
      Alert.alert("完了", "パスワードを変更しました");
    } catch {
      Alert.alert("エラー", "パスワードの変更に失敗しました");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleTogglePersonalityTag = (tag: string) => {
    setPersonalityTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      }
      if (prev.length >= MAX_PERSONALITY_TAGS) {
        Alert.alert("上限", `タグは最大${MAX_PERSONALITY_TAGS}個まで選択できます`);
        return prev;
      }
      return [...prev, tag];
    });
  };

  const handleSavePersonality = async () => {
    setIsSavingPersonality(true);
    try {
      await updateMyPersonality(personalityTags, personalityNote || null);
      Alert.alert("保存完了", "性格設定を保存しました");
    } catch {
      Alert.alert("エラー", "性格設定の保存に失敗しました");
    } finally {
      setIsSavingPersonality(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("ログアウト", "ログアウトしますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "ログアウト",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/signin");
        },
      },
    ]);
  };

  return (
    <GrassBackground>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: "transparent" }}
        contentContainerStyle={{ paddingBottom: 32, paddingTop: 16, gap: 20 }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 24, gap: 16 }}>
          <AccountCard
            session={session}
            profileDisplayName={profileDisplayName}
            profileAvatarUrl={profileAvatarUrl}
            displayNameInput={displayNameInput}
            onDisplayNameChange={setDisplayNameInput}
            avatarUrlInput={avatarUrlInput}
            onAvatarUrlChange={setAvatarUrlInput}
            onSaveAccount={handleSaveAccount}
            isSavingAccount={isSavingAccount}
            newPasswordInput={newPasswordInput}
            confirmPasswordInput={confirmPasswordInput}
            onNewPasswordChange={setNewPasswordInput}
            onConfirmPasswordChange={setConfirmPasswordInput}
            onSavePassword={handleSavePassword}
            isSavingPassword={isSavingPassword}
          />
          <PersonalitySection
            tags={PERSONALITY_TAGS}
            maxTags={MAX_PERSONALITY_TAGS}
            maxNoteLength={MAX_PERSONALITY_NOTE_LENGTH}
            personalityTags={personalityTags}
            personalityNote={personalityNote}
            isSaving={isSavingPersonality}
            onToggleTag={handleTogglePersonalityTag}
            onNoteChange={(text) =>
              setPersonalityNote(text.slice(0, MAX_PERSONALITY_NOTE_LENGTH))
            }
            onSave={handleSavePersonality}
          />
          {/* <DebugNotificationsCard
            onSendMorning={() => handleDebugNotification("morning")}
            onSendNight={() => handleDebugNotification("night")}
          />
          <DebugSettingsCard
            skipQuestionnaireLimit={skipQuestionnaireLimit}
            showEncountersWithoutNight={showEncountersWithoutNight}
            onToggleSkipLimit={handleToggleSkipLimit}
            onToggleShowEncounters={handleToggleShowEncounters}
          /> */}
          <LogoutButton onPress={handleLogout} />
        </View>
      </ScrollView>
    </GrassBackground>
  );
}
