import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ContinuousScanCounterProps {
  continuousMode: boolean;
  onToggleContinuous: () => void;
  scannedCount: number;
  lastScannedCardName?: string;
  onResetCount?: () => void;
}

export const ContinuousScanCounter: React.FC<ContinuousScanCounterProps> = ({
  continuousMode,
  onToggleContinuous,
  scannedCount,
  lastScannedCardName,
  onResetCount,
}) => {
  return (
    <View style={styles.container}>
      {/* Botón Switch Modo Continuo */}
      <TouchableOpacity
        style={[
          styles.continuousToggleBtn,
          continuousMode ? styles.continuousActive : styles.continuousInactive,
        ]}
        onPress={onToggleContinuous}
        activeOpacity={0.8}
      >
        <Ionicons
          name={continuousMode ? 'infinite' : 'stop-circle-outline'}
          size={16}
          color={continuousMode ? '#10B981' : '#94A3B8'}
        />
        <Text
          style={[
            styles.toggleLabel,
            continuousMode ? styles.toggleLabelActive : styles.toggleLabelInactive,
          ]}
        >
          {continuousMode ? 'Modo Continuo ACTIVO' : 'Escaneo Simple'}
        </Text>
      </TouchableOpacity>

      {/* Contador de cartas de la sesión */}
      <View style={styles.counterBadge}>
        <Ionicons name="albums-outline" size={14} color="#3B82F6" />
        <Text style={styles.counterText}>
          {scannedCount} {scannedCount === 1 ? 'carta' : 'cartas'}
        </Text>
        {scannedCount > 0 && onResetCount && (
          <TouchableOpacity onPress={onResetCount} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={14} color="#64748B" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        )}
      </View>

      {/* Notificación flotante de última carta escaneada */}
      {lastScannedCardName && (
        <View style={styles.lastScannedPill}>
          <Ionicons name="checkmark-circle" size={12} color="#10B981" />
          <Text style={styles.lastScannedText} numberOfLines={1}>
            Añadida: {lastScannedCardName}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
    gap: 8,
  },
  continuousToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderWidth: 1,
    gap: 6,
  },
  continuousActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  continuousInactive: {
    borderColor: '#334155',
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  toggleLabelActive: {
    color: '#10B981',
  },
  toggleLabelInactive: {
    color: '#94A3B8',
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 5,
  },
  counterText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  lastScannedPill: {
    position: 'absolute',
    top: 42,
    left: 0,
    right: 0,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 12,
    gap: 6,
  },
  lastScannedText: {
    fontSize: 11,
    color: '#A7F3D0',
    fontWeight: '600',
  },
});
