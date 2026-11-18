import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

export type MainTabType = 'cards' | 'collection' | 'decks' | 'tools' | 'social';

interface BottomTabBarProps {
  activeTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onTabChange }) => {
  const { theme } = useTheme();

  const tabs: { key: MainTabType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'cards', label: 'Cartas', icon: 'search' },
    { key: 'collection', label: 'Colección', icon: 'file-tray-full-outline' },
    { key: 'decks', label: 'Mazos', icon: 'albums-outline' },
    { key: 'tools', label: 'Herramientas', icon: 'build-outline' },
    { key: 'social', label: 'Invocador', icon: 'person-outline' },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.tabBarBackground,
          borderTopColor: theme.tabBarBorder,
        },
      ]}
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabButton}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconWrapper,
                isActive && [
                  styles.activeIconWrapper,
                  { backgroundColor: theme.glowSubtle || 'rgba(59, 130, 246, 0.12)' },
                ],
              ]}
            >
              <Ionicons
                name={tab.icon}
                size={22}
                color={isActive ? theme.primary : theme.textMuted}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                isActive
                  ? [styles.activeLabel, { color: theme.primary }]
                  : [styles.inactiveLabel, { color: theme.textMuted }],
              ]}
            >
              {tab.label}
            </Text>
            {isActive && (
              <View style={[styles.activeDot, { backgroundColor: theme.primary }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 2,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  activeIconWrapper: {
    transform: [{ scale: 1.05 }],
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeLabel: {
    fontWeight: '700',
  },
  inactiveLabel: {
    fontWeight: '500',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
