import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Achievement } from '@/constants/achievements';

const { width } = Dimensions.get('window');

interface AchievementUnlockedToastProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export const AchievementUnlockedToast: React.FC<AchievementUnlockedToastProps> = ({
  achievement,
  onDismiss,
}) => {
  const translateY = useSharedValue(-150);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);

  useEffect(() => {
    if (achievement) {
      // Trigger haptic feedback on devices
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }

      // Animate entry
      translateY.value = withSpring(0, { damping: 14, stiffness: 120 });
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 12 });

      // Auto dismiss after 4.5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 4500);

      return () => clearTimeout(timer);
    }
  }, [achievement]);

  const handleClose = () => {
    translateY.value = withTiming(-150, { duration: 300 });
    opacity.value = withTiming(0, { duration: 250 }, () => {
      runOnJS(onDismiss)();
    });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
      opacity: opacity.value,
    };
  });

  if (!achievement) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity
        style={[styles.toastCard, { borderColor: achievement.badgeColor }]}
        onPress={handleClose}
        activeOpacity={0.9}
      >
        {/* Glow de fondo */}
        <View style={[styles.glowLayer, { backgroundColor: achievement.badgeColor }]} />

        {/* Icono con badge circular */}
        <View style={[styles.iconBox, { backgroundColor: achievement.badgeColor }]}>
          <Ionicons name={achievement.icon} size={24} color="#FFFFFF" />
        </View>

        {/* Textos informativos */}
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.bannerTag}>¡LOGRO DESBLOQUEADO!</Text>
            <View style={styles.xpBadge}>
              <Text style={styles.xpText}>+{achievement.rewardXp} XP</Text>
            </View>
          </View>
          <Text style={styles.achievementTitle} numberOfLines={1}>
            {achievement.title}
          </Text>
          <Text style={styles.achievementDescription} numberOfLines={2}>
            {achievement.description}
          </Text>
        </View>

        {/* Botón cerrar */}
        <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
          <Ionicons name="close" size={16} color="#94A3B8" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 32,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastCard: {
    width: '100%',
    maxWidth: 500,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  glowLayer: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 90,
    height: 90,
    borderRadius: 45,
    opacity: 0.15,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  textContainer: {
    flex: 1,
    paddingRight: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  bannerTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.8,
  },
  xpBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  xpText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FBBF24',
  },
  achievementTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
  },
  closeBtn: {
    padding: 6,
    marginLeft: 4,
  },
});
