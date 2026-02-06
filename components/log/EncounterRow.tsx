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
import type { EncounterWithQuests } from '@/lib/api';

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
}

function getQuestSummary(completedQuests: EncounterWithQuests['completed_quests']): string {
  if (completedQuests.length > 0) {
    return `${completedQuests.length}件のクエストを達成`;
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
}: EncounterRowProps) {
  const [expanded, setExpanded] = useState(false);
  const chevronAnim = useRef(new Animated.Value(0)).current;

  const displayName = encounter.other_user_name ?? '旅の仲間';
  const questSummary = getQuestSummary(encounter.completed_quests);
  const hasQuests = encounter.completed_quests.length > 0;

  const toggleExpand = useCallback(() => {
    if (!hasQuests) return;

    LayoutAnimation.configureNext(
      LayoutAnimation.create(250, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
    );
    setExpanded((prev) => {
      const next = !prev;
      Animated.timing(chevronAnim, {
        toValue: next ? 1 : 0,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return next;
    });
  }, [hasQuests, chevronAnim]);

  const chevronRotation = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Pressable onPress={toggleExpand} style={[cardContainer, { overflow: 'hidden' }]}>
      <View style={styles.row}>
        <View style={styles.left}>
          <AvatarImage avatarUrl={encounter.other_user_avatar} size={56} />
          <View style={styles.info}>
            <Text selectable style={styles.name}>
              {displayName}
            </Text>
            <View style={styles.questRow}>
              <IconSymbol name="checkmark.seal.fill" size={14} color="#7DA15E" />
              <Text selectable numberOfLines={1} style={styles.questText}>
                {questSummary}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.rightSection}>
          <View style={styles.stampColumn}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onSendThanksStamp();
              }}
              disabled={stampSent || sending}
              style={[
                styles.stampButton,
                stampSent && styles.stampButtonSent,
              ]}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFAAB8" />
              ) : (
                <IconSymbol
                  name="heart.fill"
                  size={18}
                  color={stampSent ? '#D87D8E' : '#FFAAB8'}
                />
              )}
            </Pressable>
            <Text
              selectable
              style={[styles.stampLabel, stampSent && styles.stampLabelSent]}
            >
              お疲れ様
            </Text>
          </View>
          {hasQuests && (
            <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
              <IconSymbol name="chevron.down" size={16} color="#94A3B8" />
            </Animated.View>
          )}
        </View>
      </View>

      {expanded && hasQuests && (
        <View style={styles.expandedSection}>
          <View style={styles.divider} />
          <Text style={styles.expandedTitle}>達成したクエスト</Text>
          {encounter.completed_quests.map((quest) => (
            <View key={quest.id} style={styles.questItem}>
              <View style={styles.questIconBadge}>
                <IconSymbol name="checkmark" size={12} color="#FFFFFF" />
              </View>
              <View style={styles.questItemInfo}>
                <Text selectable style={styles.questItemTitle}>
                  {quest.title}
                </Text>
                <Text selectable style={styles.questItemTime}>
                  {formatCompletedAt(quest.completed_at)} に達成
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: '#141712',
    fontFamily: Fonts.rounded,
  },
  questRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  questText: {
    fontSize: 12,
    color: '#718268',
    flexShrink: 1,
    fontFamily: Fonts.rounded,
  },
  rightSection: {
    alignItems: 'center',
    gap: 6,
  },
  stampColumn: {
    alignItems: 'center',
    gap: 4,
  },
  stampButton: {
    height: 44,
    width: 44,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 170, 184, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampButtonSent: {
    backgroundColor: 'rgba(216, 125, 142, 0.25)',
  },
  stampLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFAAB8',
    fontFamily: Fonts.rounded,
  },
  stampLabelSent: {
    color: '#D87D8E',
  },
  expandedSection: {
    paddingHorizontal: 16,
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
