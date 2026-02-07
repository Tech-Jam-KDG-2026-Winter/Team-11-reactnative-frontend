import { Session } from "@supabase/supabase-js";
import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { AvatarImage } from "@/components/ui/avatar-image";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/theme";

const inputStyle = {
  height: 44,
  borderRadius: 12,
  backgroundColor: "rgba(168, 223, 142, 0.1)",
  paddingHorizontal: 14,
  fontSize: 13,
  color: "#141712",
  fontFamily: Fonts.rounded,
} as const;

const labelStyle = {
  fontSize: 12,
  fontWeight: "700" as const,
  color: "#718268",
  fontFamily: Fonts.rounded,
};

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
  newPasswordInput: string;
  confirmPasswordInput: string;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSavePassword: () => void;
  isSavingPassword: boolean;
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
  newPasswordInput,
  confirmPasswordInput,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSavePassword,
  isSavingPassword,
}: AccountCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      <Pressable
        onPress={() => setExpanded((prev) => !prev)}
        style={{ flexDirection: "row", alignItems: "center", gap: 14 }}
      >
        <AvatarImage avatarUrl={profileAvatarUrl} size={48} />
        <View style={{ flex: 1, minWidth: 0, justifyContent: "center", gap: 2 }}>
          <Text selectable style={[labelStyle, { fontSize: 11, letterSpacing: 0.5 }]}>
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
        <IconSymbol
          name="chevron.right"
          size={20}
          color="#718268"
          style={{ transform: [{ rotate: expanded ? "90deg" : "0deg" }] }}
        />
      </Pressable>

      {expanded && (
        <View style={{ marginTop: 16, gap: 8 }}>
          <Text selectable style={labelStyle}>
            表示名
          </Text>
          <TextInput
            placeholder="表示名を入力"
            placeholderTextColor="rgba(113, 130, 104, 0.5)"
            value={displayNameInput}
            onChangeText={onDisplayNameChange}
            style={inputStyle}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text selectable style={labelStyle}>
            アバターURL
          </Text>
          <TextInput
            placeholder="https://..."
            placeholderTextColor="rgba(113, 130, 104, 0.5)"
            value={avatarUrlInput}
            onChangeText={onAvatarUrlChange}
            style={inputStyle}
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

          <Text selectable style={[labelStyle, { marginTop: 8 }]}>
            パスワード変更
          </Text>
          <View style={{ position: "relative" }}>
            <TextInput
              placeholder="新しいパスワード"
              placeholderTextColor="rgba(113, 130, 104, 0.5)"
              value={newPasswordInput}
              onChangeText={onNewPasswordChange}
              style={[inputStyle, { paddingRight: 44 }]}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={() => setShowNewPassword((p) => !p)}
              style={{
                position: "absolute",
                right: 12,
                top: 0,
                bottom: 0,
                justifyContent: "center",
                padding: 4,
              }}
              accessibilityLabel={showNewPassword ? "パスワードを隠す" : "パスワードを表示"}
            >
              <IconSymbol
                name={showNewPassword ? "eye.slash.fill" : "eye.fill"}
                size={22}
                color="#718268"
              />
            </Pressable>
          </View>
          <View style={{ position: "relative" }}>
            <TextInput
              placeholder="新しいパスワード（確認）"
              placeholderTextColor="rgba(113, 130, 104, 0.5)"
              value={confirmPasswordInput}
              onChangeText={onConfirmPasswordChange}
              style={[inputStyle, { paddingRight: 44 }]}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={() => setShowConfirmPassword((p) => !p)}
              style={{
                position: "absolute",
                right: 12,
                top: 0,
                bottom: 0,
                justifyContent: "center",
                padding: 4,
              }}
              accessibilityLabel={showConfirmPassword ? "パスワードを隠す" : "パスワードを表示"}
            >
              <IconSymbol
                name={showConfirmPassword ? "eye.slash.fill" : "eye.fill"}
                size={22}
                color="#718268"
              />
            </Pressable>
          </View>
          <Pressable
            onPress={onSavePassword}
            disabled={isSavingPassword}
            style={{
              backgroundColor: "rgba(168, 223, 142, 0.3)",
              borderRadius: 12,
              paddingVertical: 10,
              alignItems: "center",
              opacity: isSavingPassword ? 0.7 : 1,
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
              {isSavingPassword ? "変更中..." : "パスワードを変更"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
