import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Proporción estándar de carta TCG (63mm x 88mm ≈ 0.715)
const FRAME_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 300);
const FRAME_HEIGHT = FRAME_WIDTH / 0.715;

interface ScannerOverlayProps {
  isScanning?: boolean;
  hintText?: string;
}

export const ScannerOverlay: React.FC<ScannerOverlayProps> = ({
  isScanning = true,
  hintText = 'Enfoca el nombre y arte de la carta dentro del marco',
}) => {
  const scanLinePosition = useSharedValue(0);

  useEffect(() => {
    if (isScanning) {
      scanLinePosition.value = withRepeat(
        withTiming(FRAME_HEIGHT - 6, {
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    } else {
      scanLinePosition.value = 0;
    }
  }, [isScanning, scanLinePosition]);

  const animatedLaserStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: scanLinePosition.value }],
    };
  });

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Máscara Superior */}
      <View style={styles.maskTop} />

      {/* Franja Media con el Recorte de la Carta */}
      <View style={styles.middleRow}>
        <View style={styles.maskSide} />

        {/* Marco de la Carta */}
        <View style={styles.cardFrame}>
          {/* Esquinas guía TCG */}
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />

          {/* Línea Láser animada de escaneo */}
          {isScanning && (
            <Animated.View style={[styles.scanLaser, animatedLaserStyle]}>
              <View style={styles.laserGlow} />
            </Animated.View>
          )}

          {/* Marcador superior para el título de la carta */}
          <View style={styles.titleGuideBox}>
            <Text style={styles.titleGuideText}>TÍTULO DE LA CARTA</Text>
          </View>
        </View>

        <View style={styles.maskSide} />
      </View>

      {/* Máscara Inferior con texto de ayuda */}
      <View style={styles.maskBottom}>
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>{hintText}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  maskTop: {
    width: '100%',
    flex: 1,
    backgroundColor: 'rgba(9, 13, 20, 0.72)',
  },
  middleRow: {
    flexDirection: 'row',
    height: FRAME_HEIGHT,
    width: '100%',
  },
  maskSide: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 20, 0.72)',
  },
  cardFrame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    backgroundColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  maskBottom: {
    width: '100%',
    flex: 1.2,
    backgroundColor: 'rgba(9, 13, 20, 0.72)',
    alignItems: 'center',
    paddingTop: 18,
  },
  hintContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  hintText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: '#3B82F6',
  },
  cornerTopLeft: {
    top: -1,
    left: -1,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  cornerTopRight: {
    top: -1,
    right: -1,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  cornerBottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  cornerBottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  scanLaser: {
    width: '100%',
    height: 3,
    backgroundColor: '#3B82F6',
    position: 'absolute',
    left: 0,
    top: 0,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 5,
  },
  laserGlow: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    marginTop: -4,
  },
  titleGuideBox: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  titleGuideText: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(245, 158, 11, 0.85)',
    letterSpacing: 0.8,
  },
});
