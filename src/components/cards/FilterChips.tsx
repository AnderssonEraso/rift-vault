import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CardDomain, CardType } from '@/types/card';
import { TCG_THEME } from '@/constants/tcgTheme';
import { useLanguage } from '@/context/LanguageContext';

const DOMAINS: CardDomain[] = ['All', 'Fury', 'Calm', 'Mind', 'Body', 'Chaos', 'Order'];
const TYPES: CardType[] = ['All', 'Unit', 'Spell', 'Gear', 'Legend', 'Rune'];

interface FilterChipsProps {
  selectedDomain: CardDomain;
  onSelectDomain: (domain: CardDomain) => void;
  selectedType: CardType;
  onSelectType: (type: CardType) => void;
}

export const FilterChips = ({
  selectedDomain,
  onSelectDomain,
  selectedType,
  onSelectType,
}: FilterChipsProps) => {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      {/* Scroll horizontal de Dominios / Facciones */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {DOMAINS.map(domain => {
          const isSelected = selectedDomain === domain;
          const domainColor =
            domain === 'All'
              ? TCG_THEME.colors.gold
              : TCG_THEME.domainColors[domain] ?? TCG_THEME.domainColors.Default;

          const label =
            domain === 'All'
              ? t.allDomains
              : t.domains[domain] ?? domain;

          return (
            <TouchableOpacity
              key={domain}
              activeOpacity={0.75}
              onPress={() => onSelectDomain(domain)}
              style={[
                styles.chip,
                isSelected && {
                  borderColor: domainColor,
                  backgroundColor: TCG_THEME.colors.cardHighlight,
                },
              ]}
            >
              {domain !== 'All' && (
                <View style={[styles.dot, { backgroundColor: domainColor }]} />
              )}
              <Text
                style={[
                  styles.chipText,
                  isSelected && {
                    color: domain === 'All' ? TCG_THEME.colors.gold : TCG_THEME.colors.textPrimary,
                    fontWeight: '700',
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Selector secundario de Tipos de Carta */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.typeScrollContent}
      >
        {TYPES.map(cardType => {
          const isSelected = selectedType === cardType;
          const label =
            cardType === 'All'
              ? t.allTypes
              : t.types[cardType] ?? cardType;

          return (
            <TouchableOpacity
              key={cardType}
              activeOpacity={0.75}
              onPress={() => onSelectType(cardType)}
              style={[
                styles.typeChip,
                isSelected && styles.typeChipSelected,
              ]}
            >
              <Text
                style={[
                  styles.typeChipText,
                  isSelected && styles.typeChipTextSelected,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TCG_THEME.colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: TCG_THEME.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    color: TCG_THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  typeScrollContent: {
    paddingHorizontal: 16,
    gap: 6,
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeChipSelected: {
    backgroundColor: 'rgba(10, 200, 185, 0.12)',
    borderColor: TCG_THEME.colors.cyan,
  },
  typeChipText: {
    color: TCG_THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  typeChipTextSelected: {
    color: TCG_THEME.colors.cyan,
  },
});
