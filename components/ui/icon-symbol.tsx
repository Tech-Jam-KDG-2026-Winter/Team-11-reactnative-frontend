// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Partial<Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>>;
export type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.down': 'expand-more',
  'person.fill': 'person',
  bell: 'notifications',
  sparkles: 'auto-awesome',
  ear: 'hearing',
  'heart.fill': 'favorite',
  'heart.circle.fill': 'favorite',
  'checkmark.circle.fill': 'check-circle',
  'checkmark.seal.fill': 'verified',
  'book.closed.fill': 'menu-book',
  'calendar': 'calendar-today',
  'moon.stars.fill': 'nights-stay',
  'sun.max.fill': 'wb-sunny',
  'cloud.fill': 'cloud',
  'cup.and.saucer.fill': 'local-cafe',
  'pencil': 'edit',
  'map': 'map',
  'gearshape': 'settings',
  'person.3.fill': 'groups',
  'person.2.fill': 'groups',
  'wind': 'air',
  'play.fill': 'play-arrow',
  'plus': 'add',
  'leaf': 'local-florist',
  'circle.fill': 'circle',
  'figure.walk': 'directions-walk',
  'eye.fill': 'visibility',
  'eye.slash.fill': 'visibility-off',
  'minus.circle.fill': 'remove-circle',
  'moon.zzz.fill': 'bedtime',
  'exclamationmark.triangle.fill': 'warning',
  'bed.double.fill': 'hotel',
  'lock.fill': 'lock',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
