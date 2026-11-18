import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Text } from 'react-native';
import { TCG_THEME } from '@/constants/tcgTheme';
import { useLanguage } from '@/context/LanguageContext';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  debounceMs?: number;
  placeholder?: string;
}

export const SearchBar = ({
  value,
  onChangeText,
  debounceMs = 400,
  placeholder,
}: SearchBarProps) => {
  const { t } = useLanguage();
  const [internalValue, setInternalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  const displayPlaceholder = placeholder || t.searchPlaceholder;

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (internalValue !== value) {
        onChangeText(internalValue);
      }
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [internalValue, debounceMs, onChangeText, value]);

  const handleClear = () => {
    setInternalValue('');
    onChangeText('');
  };

  return (
    <View style={[styles.container, isFocused && styles.containerFocused]}>
      {/* Icono de Lupa Hextech */}
      <View style={styles.searchIconContainer}>
        <Text style={styles.searchIconSymbol}>⌕</Text>
      </View>

      <TextInput
        style={styles.input}
        value={internalValue}
        onChangeText={setInternalValue}
        placeholder={displayPlaceholder}
        placeholderTextColor={TCG_THEME.colors.textMuted}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="never"
      />

      {internalValue.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          style={styles.clearButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t.clearSearch}
        >
          <View style={styles.clearCircle}>
            <Text style={styles.clearText}>✕</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TCG_THEME.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TCG_THEME.colors.border,
    paddingHorizontal: 12,
    height: 44,
  },
  containerFocused: {
    borderColor: TCG_THEME.colors.cyan,
    shadowColor: TCG_THEME.colors.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  searchIconContainer: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIconSymbol: {
    color: TCG_THEME.colors.cyan,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  input: {
    flex: 1,
    color: TCG_THEME.colors.textPrimary,
    fontSize: 14,
    height: '100%',
    paddingVertical: 0,
  },
  clearButton: {
    paddingLeft: 6,
  },
  clearCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: TCG_THEME.colors.cardHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: TCG_THEME.colors.border,
  },
  clearText: {
    color: TCG_THEME.colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
});
