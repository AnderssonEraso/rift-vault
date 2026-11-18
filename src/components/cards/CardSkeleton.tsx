import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { TCG_THEME } from '@/constants/tcgTheme';

export const CardSkeleton = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [opacity]);

  return (
    <View style={styles.grid}>
      {[1, 2, 3, 4, 5, 6].map(key => (
        <View key={key} style={styles.cardSkeleton}>
          <Animated.View style={[styles.imagePlaceholder, { opacity }]} />
          <View style={styles.textPlaceholderWrapper}>
            <Animated.View style={[styles.titlePlaceholder, { opacity }]} />
            <Animated.View style={[styles.subtitlePlaceholder, { opacity }]} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 6,
  },
  cardSkeleton: {
    width: '50%',
    padding: 6,
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: TCG_THEME.cardAspectRatio,
    backgroundColor: TCG_THEME.colors.cardHighlight,
    borderRadius: TCG_THEME.borderRadius,
    borderWidth: 1,
    borderColor: TCG_THEME.colors.border,
  },
  textPlaceholderWrapper: {
    paddingVertical: 8,
    gap: 6,
  },
  titlePlaceholder: {
    width: '80%',
    height: 12,
    backgroundColor: TCG_THEME.colors.cardHighlight,
    borderRadius: 4,
  },
  subtitlePlaceholder: {
    width: '50%',
    height: 10,
    backgroundColor: TCG_THEME.colors.cardHighlight,
    borderRadius: 4,
  },
});
