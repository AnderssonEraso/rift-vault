import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TCG_THEME } from '@/constants/tcgTheme';
import { useLanguage } from '@/context/LanguageContext';
import { useCollection } from '@/context/CollectionContext';
import { DEFAULT_ALL_FOLDER_ID } from '@/services/collectionRepository';

export const VaultStatsHeader = () => {
  const { t } = useLanguage();
  const { stats, activeFolder, deleteFolder } = useCollection();

  const isDefault = activeFolder?.id === DEFAULT_ALL_FOLDER_ID;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={[styles.vaultBadge, { borderColor: activeFolder?.color || TCG_THEME.colors.gold }]}>
          <Text style={styles.vaultIcon}>{activeFolder?.icon || '🏛️'}</Text>
        </View>
        <View style={styles.titleCol}>
          <Text style={[styles.vaultHeading, { color: activeFolder?.color || TCG_THEME.colors.gold }]}>
            {activeFolder?.name.toUpperCase() || t.collectionTitle}
          </Text>
          <Text style={styles.vaultSubheading}>
            {stats.uniqueCards} {t.uniqueCards.toLowerCase()} • {stats.totalCopies} {t.totalCopies.toLowerCase()}
          </Text>
        </View>

        {!isDefault && activeFolder && (
          <TouchableOpacity
            onPress={() => deleteFolder(activeFolder.id)}
            style={styles.deleteFolderBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.deleteFolderText}>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsGrid}>
        {/* Tarjeta 1: Cartas Únicas */}
        <View style={styles.statCard}>
          <Text style={styles.statCardLabel}>{t.uniqueCards}</Text>
          <Text style={styles.statCardValue}>{stats.uniqueCards}</Text>
          <Text style={styles.statCardFootnote}>en carpeta</Text>
        </View>

        {/* Tarjeta 2: Copias Totales */}
        <View style={styles.statCard}>
          <Text style={styles.statCardLabel}>{t.totalCopies}</Text>
          <Text style={styles.statCardValue}>{stats.totalCopies}</Text>
          <Text style={styles.statCardFootnote}>
            {stats.totalRegular} norm • {stats.totalFoil}★ foil
          </Text>
        </View>

        {/* Tarjeta 3: Valor de Mercado */}
        <View style={[styles.statCard, styles.statCardGold]}>
          <Text style={[styles.statCardLabel, { color: TCG_THEME.colors.gold }]}>
            {t.vaultValue}
          </Text>
          <Text style={[styles.statCardValue, { color: TCG_THEME.colors.gold }]}>
            ${stats.estimatedValueUsd.toFixed(2)}
          </Text>
          <Text style={styles.statCardFootnote}>TCG Market USD</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0E131C',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: TCG_THEME.colors.borderHighlight,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleCol: {
    flex: 1,
  },
  vaultBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(21, 27, 38, 0.95)',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultIcon: {
    fontSize: 18,
  },
  vaultHeading: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  vaultSubheading: {
    color: TCG_THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  deleteFolderBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(232, 64, 87, 0.12)',
    borderWidth: 1,
    borderColor: TCG_THEME.colors.danger,
  },
  deleteFolderText: {
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: TCG_THEME.colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: TCG_THEME.colors.border,
    padding: 10,
    alignItems: 'center',
  },
  statCardGold: {
    borderColor: TCG_THEME.colors.goldDark,
    backgroundColor: 'rgba(200, 170, 110, 0.08)',
  },
  statCardLabel: {
    color: TCG_THEME.colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statCardValue: {
    color: TCG_THEME.colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 3,
  },
  statCardFootnote: {
    color: TCG_THEME.colors.textSecondary,
    fontSize: 8,
    marginTop: 2,
    fontWeight: '500',
  },
});
