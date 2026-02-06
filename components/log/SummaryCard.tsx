import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';

import { cardContainer } from './styles';

export interface SummaryCardProps {
  icon: IconSymbolName;
  label: string;
  value: string | number;
  width: number;
  iconColor?: string;
  iconBgColor?: string;
}

export function SummaryCard({
  icon,
  label,
  value,
  width,
  iconColor = '#718268',
  iconBgColor = 'rgba(168, 223, 142, 0.1)',
}: SummaryCardProps) {
  return (
    <View style={[cardContainer, styles.card, { width }]}>
      <View style={styles.topRow}>
        <View style={[styles.iconBox, { backgroundColor: iconBgColor }]}>
          <IconSymbol name={icon} size={18} color={iconColor} />
        </View>
        <Text selectable style={styles.label}>
          {label}
        </Text>
      </View>
      <Text selectable style={styles.value}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 100,
    paddingVertical: 16,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#718268',
    fontFamily: Fonts.rounded,
    letterSpacing: 0.3,
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2C3527',
    fontFamily: Fonts.rounded,
    letterSpacing: -0.5,
    marginTop: 8,
  },
});
