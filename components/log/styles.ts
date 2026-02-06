import { StyleSheet } from 'react-native';

/** ログ画面の白カード共通スタイル（サマリーカード・EncounterRow で使用） */
export const cardContainer = {
  backgroundColor: '#FFFFFF' as const,
  borderRadius: 18,
  borderWidth: 1,
  borderColor: 'rgba(125, 161, 94, 0.12)' as const,
  shadowColor: '#2C3527' as const,
  shadowOffset: { width: 0, height: 4 } as const,
  shadowOpacity: 0.06,
  shadowRadius: 16,
  elevation: 4,
  borderCurve: 'continuous' as const,
};

/** サマリーカードのアイコン用ボックス（背景色は呼び出し元で上書き） */
export const summaryCardIconBox = {
  marginBottom: 4,
  width: 38,
  height: 34,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  borderRadius: 12,
};

/** サマリー2枚の行レイアウト用定数 */
export const CARD_ROW_MARGIN = 16;
export const CARD_GAP = 12;

export const logStyles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: CARD_ROW_MARGIN,
    gap: CARD_GAP,
    alignItems: 'stretch',
  },
  encounterList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
});
