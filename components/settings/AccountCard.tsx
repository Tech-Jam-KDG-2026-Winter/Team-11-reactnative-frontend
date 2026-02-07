import { Session } from "@supabase/supabase-js";
import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { AvatarImage } from "@/components/ui/avatar-image";
import { Fonts } from "@/constants/theme";

type AccountCardProps = {
  session: Session | null;
  profileDisplayName: string | null;
  profileAvatarUrl: string | null;
  displayNameInput: string;
  onDisplayNameChange: (value: string) => void;
  avatarUrlInput: string;
  onAvatarUrlChange: (value: string) => void;
  onSaveAccount: () => void;
  isSavingAccount: boolean;
};

export function AccountCard({
  session,
  profileDisplayName,
  profileAvatarUrl,
  displayNameInput,
  onDisplayNameChange,
  avatarUrlInput,
  onAvatarUrlChange,
  onSaveAccount,
  isSavingAccount,
}: AccountCardProps) {
  const displayName =
    profileDisplayName ?? session?.user?.user_metadata?.display_name ?? null;
  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
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
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <AvatarImage avatarUrl={profileAvatarUrl} size={48} />
        <View style={{ flex: 1, minWidth: 0, justifyContent: "center", gap: 2 }}>
          <Text
            selectable
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: "#718268",
              fontFamily: Fonts.rounded,
              letterSpacing: 0.5,
            }}
          >
            アカウント
          </Text>
          {session?.user && (
            <>
              {displayName ? (
                <Text
                  selectable
                  numberOfLines={1}
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: "#141712",
                    fontFamily: Fonts.rounded,
                  }}
                >
                  {displayName}
                </Text>
              ) : null}
              <Text
                selectable
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{
                  fontSize: 12,
                  color: "#718268",
                  fontFamily: Fonts.rounded,
                }}
              >
                {session.user.email ?? ""}
              </Text>
            </>
          )}
        </View>
      </View>

      <View style={{ marginTop: 16, gap: 8 }}>
        <Text
          selectable
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: "#718268",
            fontFamily: Fonts.rounded,
          }}
        >
          表示名
        </Text>
        <TextInput
          placeholder="表示名を入力"
          placeholderTextColor="rgba(113, 130, 104, 0.5)"
          value={displayNameInput}
          onChangeText={onDisplayNameChange}
          style={{
            height: 44,
            borderRadius: 12,
            backgroundColor: "rgba(168, 223, 142, 0.1)",
            paddingHorizontal: 14,
            fontSize: 13,
            color: "#141712",
            fontFamily: Fonts.rounded,
          }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text
          selectable
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: "#718268",
            fontFamily: Fonts.rounded,
          }}
        >
          アバターURL
        </Text>
        <TextInput
          placeholder="https://..."
          placeholderTextColor="rgba(113, 130, 104, 0.5)"
          value={avatarUrlInput}
          onChangeText={onAvatarUrlChange}
          style={{
            height: 44,
            borderRadius: 12,
            backgroundColor: "rgba(168, 223, 142, 0.1)",
            paddingHorizontal: 14,
            fontSize: 13,
            color: "#141712",
            fontFamily: Fonts.rounded,
          }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable
          onPress={onSaveAccount}
          disabled={isSavingAccount}
          style={{
            backgroundColor: "rgba(168, 223, 142, 0.3)",
            borderRadius: 12,
            paddingVertical: 10,
            alignItems: "center",
            opacity: isSavingAccount ? 0.7 : 1,
          }}
        >
          <Text
            selectable
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: "#3A4D39",
              fontFamily: Fonts.rounded,
            }}
          >
            {isSavingAccount ? "保存中..." : "保存"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
