import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';

import { AvatarImage } from '@/components/ui/avatar-image';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import type { CompletedQuest, EncounterWithQuests } from '@/lib/api';

import { cardContainer } from './styles';

// Android で LayoutAnimation を有効化
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface EncounterRowProps {
  encounter: EncounterWithQuests;
  stampSent: boolean;
  sending: boolean;
  onSendThanksStamp: () => void | Promise<void>;
  adoptedQuestIds: Set<number>;
  adoptingQuestIds: Set<number>;
  onAdoptQuest: (quest: CompletedQuest) => void | Promise<void>;
}

function getQuestText(completedQuests: EncounterWithQuests['completed_quests']): string {
  const questsToShow = completedQuests.slice(0, 3);
  if (questsToShow.length > 0) {
    return questsToShow.map((q) => `『${q.title}』`).join('、') + 'を達成しました';
  }
  return '今日のクエストに挑戦中';
}

function formatCompletedAt(dateStr: string): string {
  const date = new Date(dateStr);
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function EncounterRow({
  encounter,
  stampSent,
  sending,
  onSendThanksStamp,
  adoptedQuestIds,
  adoptingQuestIds,
  onAdoptQuest,
}: EncounterRowProps) {
  const [expanded, setExpanded] = useState(false);
  const chevronAnim = useRef(new Animated.Value(0)).current;

  const displayName = encounter.other_user_name ?? '旅の仲間';
  const questText = getQuestText(encounter.completed_quests);
  const hasCompletedQuests = encounter.completed_quests.length > 0;

  const handleToggleExpanded = useCallback(() => {
    if (!hasCompletedQuests) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => {
      const next = !prev;
      Animated.timing(chevronAnim, {
        toValue: next ? 1 : 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
      return next;
    });
  }, [chevronAnim, hasCompletedQuests]);

  return (
    <View style={[cardContainer, styles.card]}>
      <View style={styles.header}>
        <Pressable
          onPress={handleToggleExpanded}
          disabled={!hasCompletedQuests}
          style={({ pressed }) => [
            styles.headerMain,
            pressed && hasCompletedQuests && styles.headerPressed,
          ]}
        >
          <View style={styles.avatarWrapper}>
            <AvatarImage avatarUrl={encounter.other_user_avatar} size={50} />
          </View>
          <View style={styles.nameArea}>
            <Text selectable style={styles.name}>
              {displayName}
            </Text>
            <Text selectable numberOfLines={2} style={styles.subtitle}>
              {questText}
            </Text>
          </View>
          {hasCompletedQuests && (
            <Animated.View
              style={[
                styles.chevron,
                {
                  transform: [
                    {
                      rotate: chevronAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '180deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <IconSymbol name="chevron.down" size={16} color="#9CA986" />
            </Animated.View>
          )}
        </Pressable>
        <View style={styles.stampColumn}>
          <Pressable
            onPress={onSendThanksStamp}
            disabled={stampSent || sending}
            style={({ pressed }) => [
              styles.stampButton,
              stampSent && styles.stampButtonSent,
              pressed && !stampSent && styles.stampButtonPressed,
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color={stampSent ? '#FFFFFF' : '#FFAAB8'} />
            ) : (
              <IconSymbol
                name="heart.fill"
                size={18}
                color={stampSent ? '#FFFFFF' : '#FFAAB8'}
              />
            )}
          </Pressable>
          <Text selectable style={[styles.stampLabel, stampSent && styles.stampLabelSent]}>
            {stampSent ? '送信済み' : 'お疲れ様'}
          </Text>
        </View>
      </View>
      {expanded && hasCompletedQuests && (
        <View style={styles.expandedSection}>
          <View style={styles.divider} />
          <Text selectable style={styles.expandedTitle}>
            達成したクエスト
          </Text>
          {encounter.completed_quests.map((quest) => {
            const isAdopted = adoptedQuestIds.has(quest.id);
            const isAdopting = adoptingQuestIds.has(quest.id);

            return (
              <View key={quest.id} style={styles.questItem}>
                <View style={styles.questIconBadge}>
                  <IconSymbol name="checkmark.seal.fill" size={12} color="#2C3527" />
                </View>
                <View style={styles.questItemInfo}>
                  <Text selectable style={styles.questItemTitle}>
                    {quest.title}
                  </Text>
                  <Text selectable style={styles.questItemTime}>
                    {formatCompletedAt(quest.completed_at)} 完了
                  </Text>
                </View>
                <Pressable
                  onPress={() => onAdoptQuest(quest)}
                  disabled={isAdopted || isAdopting}
                  style={({ pressed }) => [
                    styles.adoptButton,
                    isAdopted && styles.adoptButtonDone,
                    pressed && !isAdopted && styles.adoptButtonPressed,
                  ]}
                >
                  {isAdopting ? (
                    <ActivityIndicator size="small" color="#FFAAB8" />
                  ) : (
                    <Text
                      selectable
                      style={[
                        styles.adoptButtonText,
                        isAdopted && styles.adoptButtonTextDone,
                      ]}
                    >
                      {isAdopted ? '追加済み' : '追加'}
                    </Text>
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerPressed: {
    opacity: 0.85,
  },
  avatarWrapper: {
    shadowColor: '#7DA15E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  nameArea: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C3527',
    fontFamily: Fonts.rounded,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA986',
    fontFamily: Fonts.rounded,
  },
  chevron: {
    width: 22,
    alignItems: 'flex-end',
  },
  stampColumn: {
    alignItems: 'center',
    gap: 4,
  },
  stampButton: {
    height: 40,
    width: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 170, 184, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 170, 184, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampButtonSent: {
    backgroundColor: '#FFAAB8',
    borderColor: '#FFAAB8',
  },
  stampButtonPressed: {
    backgroundColor: 'rgba(255, 170, 184, 0.20)',
  },
  stampLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA986',
    fontFamily: Fonts.rounded,
  },
  stampLabelSent: {
    color: '#D87D8E',
  },
  adoptButton: {
    height: 32,
    minWidth: 62,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 170, 184, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 170, 184, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  adoptButtonDone: {
    backgroundColor: 'rgba(125, 161, 94, 0.10)',
    borderColor: 'rgba(125, 161, 94, 0.20)',
  },
  adoptButtonPressed: {
    backgroundColor: 'rgba(255, 170, 184, 0.18)',
  },
  adoptButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFAAB8',
    fontFamily: Fonts.rounded,
  },
  adoptButtonTextDone: {
    color: '#7DA15E',
  },
  expandedSection: {
    marginTop: 12,
    paddingBottom: 14,
    gap: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF1ED',
    marginBottom: 2,
  },
  expandedTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    fontFamily: Fonts.rounded,
  },
  questItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  questIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: '#A8DF8E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questItemInfo: {
    flex: 1,
  },
  questItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#332D2E',
    fontFamily: Fonts.rounded,
  },
  questItemTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
    fontFamily: Fonts.rounded,
  },
});
