import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { GrassBackground } from "@/components/grass-background";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/theme";
import { updateMyPersonality } from "@/lib/api";

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

export default function PersonalityOnboardingScreen() {
  const router = useRouter();
  const [personalityTags, setPersonalityTags] = useState<string[]>([]);
  const [personalityNote, setPersonalityNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleToggleTag = (tag: string) => {
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

  const savePersonalityAndGo = async (nextRoute: "/(tabs)" | "/(onboarding)/mascot-setup") => {
    setIsSaving(true);
    try {
      await updateMyPersonality(personalityTags, personalityNote || null);
      router.push(nextRoute);
    } catch {
      Alert.alert("エラー", "性格設定の保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    // スキップして次へ進む
    router.replace("/(onboarding)/mascot-setup");
  };

  const handleSave = () => {
    savePersonalityAndGo("/(onboarding)/mascot-setup");
  };

  return (
    <GrassBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 40,
            paddingBottom: 32,
            gap: 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* ヘッダー */}
          <View style={{ alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 999,
                backgroundColor: "rgba(255, 170, 184, 0.2)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconSymbol name="sparkles" size={40} color="#FFAAB8" />
            </View>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: "#141712",
                fontFamily: Fonts.rounded,
                textAlign: "center",
              }}
            >
              マスコットの性格を決めよう
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#718268",
                fontFamily: Fonts.rounded,
                textAlign: "center",
                lineHeight: 22,
              }}
            >
              マスコットがあなたに合った{"\n"}話し方で応援してくれます
            </Text>
          </View>

          {/* メインカード */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 24,
              padding: 24,
              gap: 20,
              borderWidth: 1,
              borderColor: "#EEF1ED",
              shadowColor: "#141712",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 6,
              borderCurve: "continuous",
            }}
          >
            {/* タグ選択 */}
            <View style={{ gap: 12 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: "#141712",
                  fontFamily: Fonts.rounded,
                }}
              >
                どんな性格がいい？
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: "#718268",
                  fontFamily: Fonts.rounded,
                }}
              >
                最大{MAX_PERSONALITY_TAGS}個まで選べます（{personalityTags.length}/{MAX_PERSONALITY_TAGS}）
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {PERSONALITY_TAGS.map((tag) => {
                  const isSelected = personalityTags.includes(tag);
                  return (
                    <Pressable
                      key={tag}
                      onPress={() => handleToggleTag(tag)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 24,
                        backgroundColor: isSelected
                          ? "rgba(168, 223, 142, 0.4)"
                          : "rgba(168, 223, 142, 0.1)",
                        borderWidth: 2,
                        borderColor: isSelected ? "#A8DF8E" : "transparent",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: isSelected ? "700" : "500",
                          color: isSelected ? "#3A4D39" : "#718268",
                          fontFamily: Fonts.rounded,
                        }}
                      >
                        {tag}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 補足メモ */}
            <View style={{ gap: 10 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: "#141712",
                  fontFamily: Fonts.rounded,
                }}
              >
                こんな風に話してほしい（任意）
              </Text>
              <TextInput
                placeholder="例: 厳し目に励ましてほしい、体育会系のクエストが好きです"
                placeholderTextColor="rgba(113, 130, 104, 0.5)"
                value={personalityNote}
                onChangeText={(text) =>
                  setPersonalityNote(text.slice(0, MAX_PERSONALITY_NOTE_LENGTH))
                }
                multiline
                numberOfLines={4}
                style={{
                  minHeight: 100,
                  borderRadius: 16,
                  backgroundColor: "rgba(168, 223, 142, 0.1)",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 14,
                  color: "#141712",
                  fontFamily: Fonts.rounded,
                  textAlignVertical: "top",
                }}
              />
              <Text
                style={{
                  fontSize: 11,
                  color: "#718268",
                  fontFamily: Fonts.rounded,
                  textAlign: "right",
                }}
              >
                {personalityNote.length}/{MAX_PERSONALITY_NOTE_LENGTH}
              </Text>
            </View>
          </View>

          {/* ボタン */}
          <View style={{ gap: 12 }}>
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              style={{
                backgroundColor: "#FFAAB8",
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                opacity: isSaving ? 0.7 : 1,
                shadowColor: "#FFAAB8",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#FFFFFF",
                  fontFamily: Fonts.rounded,
                }}
              >
                {isSaving ? "保存中..." : "保存して進める"}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSkip}
              style={{
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#718268",
                  fontFamily: Fonts.rounded,
                }}
              >
                スキップして後で設定する
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GrassBackground>
  );
}
