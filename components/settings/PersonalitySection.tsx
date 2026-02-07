import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/theme";

type PersonalitySectionProps = {
  tags: readonly string[];
  maxTags: number;
  maxNoteLength: number;
  personalityTags: string[];
  personalityNote: string;
  isSaving: boolean;
  onToggleTag: (tag: string) => void;
  onNoteChange: (text: string) => void;
  onSave: () => void;
};

export function PersonalitySection({
  tags,
  maxTags,
  maxNoteLength,
  personalityTags,
  personalityNote,
  isSaving,
  onToggleTag,
  onNoteChange,
  onSave,
}: PersonalitySectionProps) {
  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        gap: 16,
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
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            backgroundColor: "rgba(255, 170, 184, 0.2)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconSymbol name="sparkles" size={18} color="#FFAAB8" />
        </View>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: "#141712",
            fontFamily: Fonts.rounded,
          }}
        >
          マスコットの性格
        </Text>
      </View>

      <View style={{ gap: 8 }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: "#718268",
            fontFamily: Fonts.rounded,
          }}
        >
          マスコットの性格タグ（最大{maxTags}個）
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {tags.map((tag) => {
            const isSelected = personalityTags.includes(tag);
            return (
              <Pressable
                key={tag}
                onPress={() => onToggleTag(tag)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: isSelected
                    ? "rgba(168, 223, 142, 0.4)"
                    : "rgba(168, 223, 142, 0.1)",
                  borderWidth: 1,
                  borderColor: isSelected ? "#A8DF8E" : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
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

      <View style={{ gap: 8 }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: "#718268",
            fontFamily: Fonts.rounded,
          }}
        >
          補足メモ（最大{maxNoteLength}文字）
        </Text>
        <TextInput
          placeholder="例: 厳し目に励ましてほしい、体育会系のクエストが好きです"
          placeholderTextColor="rgba(113, 130, 104, 0.5)"
          value={personalityNote}
          onChangeText={onNoteChange}
          multiline
          numberOfLines={3}
          style={{
            minHeight: 80,
            borderRadius: 12,
            backgroundColor: "rgba(168, 223, 142, 0.1)",
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 13,
            color: "#141712",
            fontFamily: Fonts.rounded,
            textAlignVertical: "top",
          }}
        />
        <Text
          style={{
            fontSize: 10,
            color: "#718268",
            fontFamily: Fonts.rounded,
            textAlign: "right",
          }}
        >
          {personalityNote.length}/{maxNoteLength}
        </Text>
      </View>

      <Pressable
        onPress={onSave}
        disabled={isSaving}
        style={{
          backgroundColor: "rgba(255, 170, 184, 0.3)",
          borderRadius: 12,
          paddingVertical: 12,
          alignItems: "center",
          opacity: isSaving ? 0.7 : 1,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: "#6B3E45",
            fontFamily: Fonts.rounded,
          }}
        >
          {isSaving ? "保存中..." : "マスコットの性格を保存"}
        </Text>
      </Pressable>
    </View>
  );
}
