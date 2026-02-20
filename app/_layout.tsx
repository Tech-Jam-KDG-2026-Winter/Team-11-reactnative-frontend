import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import "react-native-reanimated";
import * as Location from "expo-location";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLocation } from "@/hooks/use-location";
import { AuthProvider } from "@/providers/AuthProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { recordLocation } from "@/lib/api/location";

const FOREGROUND_INTERVAL_MS = 60_000;

export const unstable_settings = {
  anchor: "(auth)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { requestPermissions, startTracking, permissions } = useLocation();
  const foregroundTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // フォアグラウンド時に1分ごと位置情報をポストするタイマー
  const startForegroundTimer = () => {
    if (foregroundTimerRef.current !== null) return;
    foregroundTimerRef.current = setInterval(async () => {
      try {
        const { coords } = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        await recordLocation(coords.latitude, coords.longitude, coords.accuracy ?? undefined);
      } catch {
      }
    }, FOREGROUND_INTERVAL_MS);
  };

  const stopForegroundTimer = () => {
    if (foregroundTimerRef.current !== null) {
      clearInterval(foregroundTimerRef.current);
      foregroundTimerRef.current = null;
    }
  };

  // アプリ起動時に位置情報の権限を要求し、トラッキングを開始
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        await requestPermissions();
      } catch (error) {
        console.error("位置情報の初期化に失敗:", error);
      }
    };

    initializeLocation();
  }, []);

  useEffect(() => {
    if (permissions?.foreground) {
      startForegroundTimer();
    }
  }, [permissions]);

  useEffect(() => {
    if (permissions?.foreground && permissions?.background) {
      startTracking().catch((error) => {
        console.error("トラッキングの開始に失敗:", error);
      });
    }
  }, [permissions]);

  // フォアグラウンド / バックグラウンド切り替えでタイマーを制御
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        startForegroundTimer();
      } else {
        stopForegroundTimer();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => {
      subscription.remove();
      stopForegroundTimer();
    };
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack
            screenOptions={{
              animationTypeForReplace: "pop",
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{ presentation: "modal", title: "Modal" }}
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
