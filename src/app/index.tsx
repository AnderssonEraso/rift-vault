import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  StatusBar as RNStatusBar,
  Platform,
  ActivityIndicator,
  Text,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { CollectionProvider } from '@/context/CollectionContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { DeckProvider } from '@/context/DeckContext';
import { ProfileProvider } from '@/context/ProfileContext';
import { AchievementProvider } from '@/context/AchievementContext';
import { AIProvider } from '@/context/AIContext';
import { BottomTabBar, MainTabType } from '@/components/navigation/BottomTabBar';
import { CardsExplorerScreen } from '@/screens/CardsExplorerScreen';
import { CollectionScreen } from '@/screens/CollectionScreen';
import { DecksScreen } from '@/screens/DecksScreen';
import { ToolsScreen } from '@/screens/ToolsScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { LoginScreen } from '@/screens/LoginScreen';

function AppRoot() {
  const [activeTab, setActiveTab] = useState<MainTabType>('cards');
  const { theme, mode } = useTheme();

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'cards':
        return <CardsExplorerScreen />;
      case 'collection':
        return <CollectionScreen />;
      case 'decks':
        return <DecksScreen />;
      case 'tools':
        return <ToolsScreen />;
      case 'social':
        return <ProfileScreen />;
      default:
        return <CardsExplorerScreen />;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
        {renderActiveScreen()}
      </View>
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </SafeAreaView>
  );
}

function MainNavigator() {
  const { user, isLoading } = useAuth();
  const { theme, mode } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Conectando con el Nexo...
        </Text>
      </View>
    );
  }

  // Si no está autenticado, mostrar pantalla de Login antes de entrar
  if (!user) {
    return <LoginScreen />;
  }

  // Si está autenticado, renderizar la app completa con todos los proveedores
  return (
    <ProfileProvider>
      <CollectionProvider>
        <WishlistProvider>
          <DeckProvider>
            <AchievementProvider>
              <AIProvider>
                <AppRoot />
              </AIProvider>
            </AchievementProvider>
          </DeckProvider>
        </WishlistProvider>
      </CollectionProvider>
    </ProfileProvider>
  );
}

export default function HomeScreen() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MainNavigator />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090D14',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#090D14',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#090D14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 14,
    color: '#8E9AA8',
    fontSize: 14,
    fontWeight: '600',
  },
});
