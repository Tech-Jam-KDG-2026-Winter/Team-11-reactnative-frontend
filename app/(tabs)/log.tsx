import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GrassBackground } from '@/components/grass-background';
import { EncounterRow } from '@/components/log/EncounterRow';
import { LogEmptyView } from '@/components/log/LogEmptyView';
import { LogLockedView } from '@/components/log/LogLockedView';
import { SummaryCard } from '@/components/log/SummaryCard';
import { CARD_GAP, CARD_ROW_MARGIN, logStyles } from '@/components/log/styles';
import { Fonts } from '@/constants/theme';
import { useNightQuestionnaire } from '@/hooks/use-night-questionnaire';
import { useAuth } from '@/hooks/use-auth';
import {
  adoptEncounterQuest,
  getMyEncounters,
  getThanksStampSentByEncounterIds,
  getThanksStampsReceivedCountToday,
  getTodayQuests,
  sendThanksStamp,
  type EncounterWithQuests,
  type CompletedQuest,
} from '@/lib/api';

const DEBUG_SHOW_ENCOUNTERS_WITHOUT_NIGHT_KEY = 'debug:showEncountersWithoutNight';

const getDebugShowEncountersWithoutNight = async (): Promise<boolean> => {
  try {
    const raw = await AsyncStorage.getItem(DEBUG_SHOW_ENCOUNTERS_WITHOUT_NIGHT_KEY);
    return raw === 'true';
  } catch {
    return false;
  }
};

export default function LogScreen() {
  const { isCompleted, isLoading: isLoadingQuestionnaire } = useNightQuestionnaire();
  const { session } = useAuth();
  const userUuid = session?.user?.id;
  const [encounters, setEncounters] = useState<EncounterWithQuests[]>([]);
  const [isLoadingEncounters, setIsLoadingEncounters] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [thanksStampsCount, setThanksStampsCount] = useState(0);
  const [stampSentIds, setStampSentIds] = useState<Set<number>>(new Set());
  const [sendingEncounterId, setSendingEncounterId] = useState<number | null>(null);
  const [adoptedQuestIds, setAdoptedQuestIds] = useState<Set<number>>(new Set());
  const [adoptingQuestIds, setAdoptingQuestIds] = useState<Set<number>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentWidth = windowWidth - insets.left - insets.right;
  const cardWidth = Math.floor((contentWidth - CARD_ROW_MARGIN * 2 - CARD_GAP) / 2);

  useFocusEffect(
    useCallback(() => {
      const loadDebugMode = async () => {
        const isDebugMode = await getDebugShowEncountersWithoutNight();
        setDebugMode(isDebugMode);
      };
      loadDebugMode();
    }, [])
  );

  const loadEncounters = useCallback(async (): Promise<EncounterWithQuests[]> => {
    if (!(debugMode || isCompleted)) return [];

    setIsLoadingEncounters(true);
    try {
      const data = await getMyEncounters();
      const today = new Date().toISOString().split('T')[0];
      const todayEncounters = data.filter((encounter) => {
        const encounterDate = new Date(encounter.last_seen_at).toISOString().split('T')[0];
        return encounterDate === today;
      });
      setEncounters(todayEncounters);
      return todayEncounters;
    } catch (error) {
      console.error('すれ違い情報の取得に失敗:', error);
      return [];
    } finally {
      setIsLoadingEncounters(false);
    }
  }, [debugMode, isCompleted]);

  const loadAdoptedQuests = useCallback(async () => {
    if (!userUuid) return;
    try {
      const myQuests = await getTodayQuests(userUuid);
      const adoptedIds = new Set(
        myQuests
          .map((quest) => quest.source_quest_id)
          .filter((id): id is number => typeof id === 'number')
      );
      setAdoptedQuestIds(adoptedIds);
    } catch (error) {
      console.error('採用済みクエストの取得に失敗:', error);
    }
  }, [userUuid]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    const list = await loadEncounters();
    await loadAdoptedQuests();
    if (list.length > 0) {
      try {
        const [count, sentSet] = await Promise.all([
          getThanksStampsReceivedCountToday(),
          getThanksStampSentByEncounterIds(list.map((e) => e.id)),
        ]);
        setThanksStampsCount(count);
        setStampSentIds(sentSet);
      } catch (error) {
        console.error('スタンプデータの更新に失敗:', error);
      }
    }
    setIsRefreshing(false);
  }, [loadEncounters, loadAdoptedQuests]);

  useEffect(() => {
    if ((debugMode || isCompleted) && !isLoadingQuestionnaire) {
      loadEncounters();
      loadAdoptedQuests();
    }
  }, [isCompleted, isLoadingQuestionnaire, debugMode, loadEncounters, loadAdoptedQuests]);

  useEffect(() => {
    if (!isLoadingEncounters) {
      const loadStampData = async () => {
        const [count, sentSet] = await Promise.all([
          getThanksStampsReceivedCountToday(),
          encounters.length > 0
            ? getThanksStampSentByEncounterIds(encounters.map((e) => e.id))
            : Promise.resolve(new Set<number>()),
        ]);
        setThanksStampsCount(count);
        setStampSentIds(sentSet);
      };
      loadStampData();
    }
  }, [encounters, isLoadingEncounters]);

  const handleThanksStamp = useCallback(
    async (encounterId: number) => {
      const encounter = encounters.find((e) => e.id === encounterId);
      if (!encounter || stampSentIds.has(encounterId) || sendingEncounterId === encounterId) return;

      setSendingEncounterId(encounterId);
      try {
        await sendThanksStamp(encounter.id, encounter.other_user_id);
        setStampSentIds((prev) => new Set(prev).add(encounterId));
      } catch (err) {
        Alert.alert(
          '送信できませんでした',
          err instanceof Error ? err.message : 'お疲れ様スタンプの送信に失敗しました。'
        );
      } finally {
        setSendingEncounterId(null);
      }
    },
    [encounters, stampSentIds, sendingEncounterId]
  );

  const handleAdoptQuest = useCallback(
    async (encounter: EncounterWithQuests, quest: CompletedQuest) => {
      if (!userUuid) return;
      if (adoptedQuestIds.has(quest.id) || adoptingQuestIds.has(quest.id)) return;

      setAdoptingQuestIds((prev) => new Set(prev).add(quest.id));
      try {
        await adoptEncounterQuest(userUuid, {
          title: quest.title,
          description: quest.description ?? undefined,
          source_user_uuid: encounter.other_user_id,
          source_user_name: encounter.other_user_name ?? null,
          source_quest_id: quest.id,
          source_encounter_id: encounter.id,
        });
        setAdoptedQuestIds((prev) => {
          const next = new Set(prev);
          next.add(quest.id);
          return next;
        });
      } catch (err) {
        Alert.alert(
          '追加できませんでした',
          err instanceof Error ? err.message : 'クエストの追加に失敗しました。'
        );
      } finally {
        setAdoptingQuestIds((prev) => {
          const next = new Set(prev);
          next.delete(quest.id);
          return next;
        });
      }
    },
    [userUuid, adoptedQuestIds, adoptingQuestIds]
  );

  if (!isCompleted && !debugMode) {
    return <LogLockedView />;
  }

  return (
    <GrassBackground>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={{
          paddingBottom: 32,
          paddingTop: 20,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          gap: 20,
          flexGrow: 0,
        }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#FFAAB8" />
        }
      >
        <View style={logStyles.summaryRow}>
          <SummaryCard
            icon="person.3.fill"
            label="今日すれ違った"
            value={`${encounters.length}人`}
            width={cardWidth}
            iconColor="#7DA15E"
            iconBgColor="rgba(125, 161, 94, 0.08)"
          />
          <SummaryCard
            icon="heart.fill"
            label="お疲れ様スタンプ"
            value={`${thanksStampsCount}件`}
            width={cardWidth}
            iconColor="#D87D8E"
            iconBgColor="rgba(255, 170, 184, 0.12)"
          />
        </View>

        {isLoadingEncounters && (
          <View style={logStyles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFAAB8" />
          </View>
        )}

        {!isLoadingEncounters && encounters.length > 0 && (
          <View style={logStyles.encounterList}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: '#9CA986',
                fontFamily: Fonts.rounded,
                letterSpacing: 0.3,
                marginBottom: -2,
              }}
            >
              今日すれ違った仲間
            </Text>
            {encounters.map((encounter) => (
              <EncounterRow
                key={encounter.id}
                encounter={encounter}
                stampSent={stampSentIds.has(encounter.id)}
                sending={sendingEncounterId === encounter.id}
                onSendThanksStamp={() => handleThanksStamp(encounter.id)}
                adoptedQuestIds={adoptedQuestIds}
                adoptingQuestIds={adoptingQuestIds}
                onAdoptQuest={(quest) => handleAdoptQuest(encounter, quest)}
              />
            ))}
          </View>
        )}

        {!isLoadingEncounters && encounters.length === 0 && <LogEmptyView />}

        <View style={{ paddingHorizontal: 24, paddingTop: 12, alignItems: 'center', gap: 10 }}>
          <Text
            selectable
            style={{
              fontSize: 13,
              color: '#7DA15E',
              textAlign: 'center',
              fontWeight: '700',
              fontFamily: Fonts.rounded,
              letterSpacing: 0.2,
            }}
          >
            他のユーザーが達成したクエストに挑戦してみましょう
          </Text>
          <Text
            selectable
            style={{
              fontSize: 12,
              color: '#718268',
              fontStyle: 'italic',
              textAlign: 'center',
              fontFamily: Fonts.rounded,
            }}
          >
            &quot;みんな、今日も自分なりに頑張っています。&quot;
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                backgroundColor: 'rgba(255, 170, 184, 0.4)',
              }}
            />
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                backgroundColor: 'rgba(255, 170, 184, 0.4)',
              }}
            />
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                backgroundColor: 'rgba(255, 170, 184, 0.4)',
              }}
            />
          </View>
        </View>
      </ScrollView>
    </GrassBackground>
  );
}
