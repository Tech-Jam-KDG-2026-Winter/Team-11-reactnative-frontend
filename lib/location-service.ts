import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { recordLocation } from "./api/location";

const BACKGROUND_LOCATION_TASK = "BACKGROUND_LOCATION_TASK";

// バックグラウンドタスクの定義
TaskManager.defineTask(
  BACKGROUND_LOCATION_TASK,
  async ({
    data,
    error,
  }: TaskManager.TaskManagerTaskBody<{ locations: Location.LocationObject[] }>) => {
    if (error) {
      // iOS kCLErrorDomain code 0 = 位置が一時的に不明（シミュレータやExpo Goでよく発生、次の更新で解消する）
      const isLocationUnknown =
        typeof error === "object" && error !== null && "code" in error && (error as { code?: number }).code === 0;
      if (isLocationUnknown) {
        console.warn("バックグラウンド位置情報: 一時的に取得できません（次の更新を待ちます）");
      } else {
        console.error("バックグラウンド位置情報タスクエラー:", error);
      }
      return;
    }

    if (data) {
      const { locations } = data;
      const location = locations[0];

      if (location) {
        try {
          console.log(
            "バックグラウンドで位置情報を記録:",
            location.coords.latitude,
            location.coords.longitude
          );

          await recordLocation(
            location.coords.latitude,
            location.coords.longitude,
            location.coords.accuracy ?? undefined
          );
        } catch (err) {
          // 未ログイン時のスキップはエラーとして扱わない
          if (err instanceof Error && err.message.includes("未ログイン")) {
            console.log("バックグラウンド: 未ログインのためスキップ");
          } else {
            console.error("位置情報の記録に失敗:", err);
          }
        }
      }
    }
  }
);

/**
 * 位置情報の権限を要求（フォアグラウンド + バックグラウンド）
 */
export async function requestLocationPermissions(): Promise<{
  foreground: boolean;
  background: boolean;
}> {
  // フォアグラウンド権限を要求
  const { status: foregroundStatus } =
    await Location.requestForegroundPermissionsAsync();

  if (foregroundStatus !== "granted") {
    console.warn("フォアグラウンド位置情報の権限が拒否されました");
    return { foreground: false, background: false };
  }

  // バックグラウンド権限を要求
  const { status: backgroundStatus } =
    await Location.requestBackgroundPermissionsAsync();

  if (backgroundStatus !== "granted") {
    console.warn("バックグラウンド位置情報の権限が拒否されました");
    return { foreground: true, background: false };
  }

  return { foreground: true, background: true };
}

/**
 * バックグラウンド位置情報トラッキングを開始
 */
export async function startLocationTracking(): Promise<boolean> {
  try {
    // 権限を確認
    const { status: foregroundStatus } =
      await Location.getForegroundPermissionsAsync();
    const { status: backgroundStatus } =
      await Location.getBackgroundPermissionsAsync();

    if (foregroundStatus !== "granted" || backgroundStatus !== "granted") {
      console.warn("位置情報の権限がありません");
      return false;
    }

    // 既にトラッキング中かチェック
    const isTracking = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK
    );

    if (isTracking) {
      console.log("既にバックグラウンドトラッキング中です");
      return true;
    }

    // バックグラウンド位置情報更新を開始
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced, // バッテリー消費を抑制
      timeInterval: 60000, // 1分ごと（ミリ秒）
      distanceInterval: 0, // 距離による制限なし
      activityType: Location.ActivityType.Other, // iOSがバックグラウンド更新を最適化するためのヒント
      foregroundService: {
        notificationTitle: "すれ違い機能",
        notificationBody: "位置情報を記録しています",
        notificationColor: "#A8DF8E",
      },
      pausesUpdatesAutomatically: false, // 自動停止しない
      showsBackgroundLocationIndicator: false,
    });

    console.log("バックグラウンドトラッキングを開始しました");
    return true;
  } catch (error) {
    console.error("バックグラウンドトラッキングの開始に失敗:", error);
    return false;
  }
}

/**
 * バックグラウンド位置情報トラッキングを停止
 */
export async function stopLocationTracking(): Promise<void> {
  try {
    const isTracking = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK
    );

    if (isTracking) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      console.log("バックグラウンドトラッキングを停止しました");
    }
  } catch (error) {
    console.error("バックグラウンドトラッキングの停止に失敗:", error);
  }
}

/**
 * トラッキング状態を確認
 */
export async function isLocationTrackingActive(): Promise<boolean> {
  try {
    return await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK
    );
  } catch (error) {
    console.error("トラッキング状態の確認に失敗:", error);
    return false;
  }
}