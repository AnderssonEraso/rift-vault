import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useProfile } from '@/context/ProfileContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme, FactionThemeKey, ThemeMode } from '@/context/ThemeContext';
import { useAchievements } from '@/context/AchievementContext';
import { AchievementCategory } from '@/constants/achievements';
import { EditProfileModal } from '@/components/profile/EditProfileModal';

type ProfileSectionTab = 'achievements' | 'themes' | 'friends';

export const ProfileScreen: React.FC = () => {
  const { signOut, user } = useAuth();
  const { profile, addFriend, removeFriend } = useProfile();
  const { theme, faction, mode, setFaction, setMode, toggleMode, factionsList } = useTheme();
  const { evaluations, unlockedCount, totalCount, totalXp, summonerRank } = useAchievements();

  const [activeTab, setActiveTab] = useState<ProfileSectionTab>('achievements');
  const [selectedAchievementCategory, setSelectedAchievementCategory] = useState<string>('all');
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [searchFriendText, setSearchFriendText] = useState('');
  const [newFriendInput, setNewFriendInput] = useState('');
  const [isAddingFriend, setIsAddingFriend] = useState(false);

  const handleSignOut = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar Sesión', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  const handleSelectFaction = (key: FactionThemeKey) => {
    triggerHaptic();
    setFaction(key);
  };

  const handleToggleMode = () => {
    triggerHaptic();
    toggleMode();
  };

  // Filtrado de amigos
  const filteredFriends = profile.friends.filter(f =>
    f.username.toLowerCase().includes(searchFriendText.toLowerCase().trim())
  );

  const handleAddFriend = () => {
    if (!newFriendInput.trim()) {
      setIsAddingFriend(!isAddingFriend);
      return;
    }
    const success = addFriend(newFriendInput.trim());
    if (success) {
      Alert.alert('¡Amigo añadido!', `Se ha enviado la solicitud a ${newFriendInput.trim()}.`);
      setNewFriendInput('');
      setIsAddingFriend(false);
    } else {
      Alert.alert('Aviso', 'Este invocador ya está en tu lista de amigos o el nombre no es válido.');
    }
  };

  // Filtrado de logros por categoría
  const filteredEvaluations = evaluations.filter(item => {
    if (selectedAchievementCategory === 'all') return true;
    return item.achievement.category === selectedAchievementCategory;
  });

  const categories: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'all', label: 'Todos', icon: 'apps-outline' },
    { key: 'collection', label: 'Colección', icon: 'file-tray-full-outline' },
    { key: 'decks', label: 'Mazos', icon: 'layers-outline' },
    { key: 'competitive', label: 'Competitivo', icon: 'trophy-outline' },
    { key: 'social', label: 'Social', icon: 'people-outline' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View style={[styles.topHeader, { borderBottomColor: theme.cardBorder }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Invocador</Text>
          <View style={[styles.rankSmallBadge, { backgroundColor: summonerRank.badgeColor + '25', borderColor: summonerRank.badgeColor }]}>
            <Text style={[styles.rankSmallText, { color: summonerRank.badgeColor }]}>
              {summonerRank.title}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.modeToggleBtn, { backgroundColor: theme.cardHighlight, borderColor: theme.cardBorder }]}
            onPress={handleToggleMode}
            activeOpacity={0.7}
          >
            <Ionicons
              name={mode === 'dark' ? 'moon' : 'sunny'}
              size={18}
              color={mode === 'dark' ? '#FBBF24' : '#F59E0B'}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={22} color={theme.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card & Avatar */}
        <View style={[styles.profileSection, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={() => setIsEditModalVisible(true)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: profile.avatarUrl }}
              style={[styles.avatarImage, { borderColor: theme.primary }]}
            />
            <View style={[styles.avatarBadge, { backgroundColor: theme.primary }]}>
              <Ionicons name="create-outline" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.usernameTouchable}
            onPress={() => setIsEditModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.usernameText, { color: theme.textPrimary }]}>
              {profile.username}
            </Text>
            <Text style={[styles.editSubtext, { color: theme.textMuted }]}>
              {user?.email || 'Invocador del Nexo'} • Toca para editar
            </Text>
          </TouchableOpacity>

          {profile.tagline ? (
            <View style={[styles.taglineBadge, { backgroundColor: theme.cardHighlight, borderColor: theme.cardBorder }]}>
              <Text style={[styles.taglineText, { color: theme.textSecondary }]}>
                {profile.tagline}
              </Text>
            </View>
          ) : null}

          {/* Estadísticas de jugador en cuadrícula */}
          <View style={[styles.statsRow, { backgroundColor: theme.cardHighlight, borderColor: theme.cardBorder }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.primary }]}>
                {profile.stats.cardsOwned}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Cartas</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.cardBorder }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.primary }]}>
                {profile.stats.decksBuilt}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Mazos</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.cardBorder }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.primary }]}>
                {profile.stats.matchesWon}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Victorias</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.cardBorder }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.primary }]}>
                {unlockedCount}/{totalCount}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Logros</Text>
            </View>
          </View>
        </View>

        {/* Selector de Sección: Logros / Temas / Amigos */}
        <View style={[styles.tabSelectorContainer, { backgroundColor: theme.cardHighlight }]}>
          <TouchableOpacity
            style={[
              styles.tabSelectorItem,
              activeTab === 'achievements' && [styles.activeTabSelectorItem, { backgroundColor: theme.primary }],
            ]}
            onPress={() => {
              triggerHaptic();
              setActiveTab('achievements');
            }}
          >
            <Ionicons
              name="ribbon-outline"
              size={16}
              color={activeTab === 'achievements' ? '#FFFFFF' : theme.textMuted}
            />
            <Text
              style={[
                styles.tabSelectorText,
                { color: activeTab === 'achievements' ? '#FFFFFF' : theme.textMuted },
              ]}
            >
              Vitrina ({unlockedCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabSelectorItem,
              activeTab === 'themes' && [styles.activeTabSelectorItem, { backgroundColor: theme.primary }],
            ]}
            onPress={() => {
              triggerHaptic();
              setActiveTab('themes');
            }}
          >
            <Ionicons
              name="color-palette-outline"
              size={16}
              color={activeTab === 'themes' ? '#FFFFFF' : theme.textMuted}
            />
            <Text
              style={[
                styles.tabSelectorText,
                { color: activeTab === 'themes' ? '#FFFFFF' : theme.textMuted },
              ]}
            >
              Facciones
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabSelectorItem,
              activeTab === 'friends' && [styles.activeTabSelectorItem, { backgroundColor: theme.primary }],
            ]}
            onPress={() => {
              triggerHaptic();
              setActiveTab('friends');
            }}
          >
            <Ionicons
              name="people-outline"
              size={16}
              color={activeTab === 'friends' ? '#FFFFFF' : theme.textMuted}
            />
            <Text
              style={[
                styles.tabSelectorText,
                { color: activeTab === 'friends' ? '#FFFFFF' : theme.textMuted },
              ]}
            >
              Amigos ({profile.friends.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ======================================================== */}
        {/* SECCIÓN 1: VITRINA DE LOGROS E INSIGNIAS DE INVOCADOR    */}
        {/* ======================================================== */}
        {activeTab === 'achievements' && (
          <View style={styles.sectionWrapper}>
            {/* Tarjeta de Rango de Invocador y XP */}
            <View style={[styles.summonerRankCard, { backgroundColor: theme.card, borderColor: theme.cardBorderHighlight }]}>
              <View style={styles.rankHeaderRow}>
                <View style={[styles.rankIconCircle, { backgroundColor: summonerRank.badgeColor }]}>
                  <Ionicons name="sparkles" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.rankTitleCol}>
                  <Text style={[styles.rankLevelSub, { color: theme.textMuted }]}>
                    NIVEL DE INVOCADOR
                  </Text>
                  <Text style={[styles.rankMainTitle, { color: theme.textPrimary }]}>
                    {summonerRank.title}
                  </Text>
                </View>
                <View style={[styles.xpBadgeBox, { backgroundColor: theme.glowSubtle, borderColor: theme.primary }]}>
                  <Text style={[styles.xpBadgeText, { color: theme.primary }]}>
                    {totalXp} XP
                  </Text>
                </View>
              </View>

              {/* Barra de progreso hacia el siguiente nivel */}
              <View style={styles.rankProgressContainer}>
                <View style={styles.rankProgressHeader}>
                  <Text style={[styles.rankProgressLabel, { color: theme.textSecondary }]}>
                    Progreso al siguiente hito
                  </Text>
                  <Text style={[styles.rankProgressValue, { color: theme.textPrimary }]}>
                    {totalXp} / {summonerRank.nextXp} XP
                  </Text>
                </View>
                <View style={[styles.rankProgressBarTrack, { backgroundColor: theme.cardHighlight }]}>
                  <View
                    style={[
                      styles.rankProgressBarFill,
                      {
                        width: `${Math.min(100, Math.round((totalXp / summonerRank.nextXp) * 100))}%`,
                        backgroundColor: summonerRank.badgeColor,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.achievementsSummaryRow}>
                <Ionicons name="trophy" size={16} color="#EAB308" />
                <Text style={[styles.achievementsSummaryText, { color: theme.textSecondary }]}>
                  {unlockedCount} de {totalCount} insignias desbloqueadas (
                  {Math.round((unlockedCount / totalCount) * 100)}% completado)
                </Text>
              </View>
            </View>

            {/* Categorías de Filtro */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryChipsScroll}
            >
              {categories.map(cat => {
                const isSelected = selectedAchievementCategory === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.card,
                        borderColor: isSelected ? theme.primary : theme.cardBorder,
                      },
                    ]}
                    onPress={() => {
                      triggerHaptic();
                      setSelectedAchievementCategory(cat.key);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={14}
                      color={isSelected ? '#FFFFFF' : theme.textSecondary}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Lista de Insignias / Logros */}
            <View style={styles.achievementsList}>
              {filteredEvaluations.map(({ achievement, currentValue, targetValue, isUnlocked, unlockedAt, progressPercent }) => {
                return (
                  <View
                    key={achievement.id}
                    style={[
                      styles.achievementCard,
                      {
                        backgroundColor: theme.card,
                        borderColor: isUnlocked ? achievement.badgeColor : theme.cardBorder,
                        opacity: isUnlocked ? 1 : 0.85,
                      },
                    ]}
                  >
                    {/* Badge Icon (A color si desbloqueado, en gris si bloqueado) */}
                    <View
                      style={[
                        styles.badgeIconBox,
                        {
                          backgroundColor: isUnlocked ? achievement.badgeColor : theme.cardHighlight,
                          borderColor: isUnlocked ? 'rgba(255,255,255,0.25)' : theme.cardBorder,
                        },
                      ]}
                    >
                      <Ionicons
                        name={isUnlocked ? achievement.icon : 'lock-closed-outline'}
                        size={22}
                        color={isUnlocked ? '#FFFFFF' : theme.textMuted}
                      />
                    </View>

                    {/* Información del Logro */}
                    <View style={styles.achievementContent}>
                      <View style={styles.achievementTitleRow}>
                        <Text
                          style={[
                            styles.achievementCardTitle,
                            { color: isUnlocked ? theme.textPrimary : theme.textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          {achievement.title}
                        </Text>
                        <View
                          style={[
                            styles.xpTag,
                            {
                              backgroundColor: isUnlocked ? 'rgba(245, 158, 11, 0.15)' : theme.cardHighlight,
                              borderColor: isUnlocked ? 'rgba(245, 158, 11, 0.3)' : theme.cardBorder,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.xpTagText,
                              { color: isUnlocked ? '#FBBF24' : theme.textMuted },
                            ]}
                          >
                            +{achievement.rewardXp} XP
                          </Text>
                        </View>
                      </View>

                      <Text style={[styles.achievementCardDesc, { color: theme.textMuted }]}>
                        {achievement.description}
                      </Text>

                      {/* Estado: Desbloqueado vs Barra de Progreso */}
                      {isUnlocked ? (
                        <View style={styles.unlockedMetaRow}>
                          <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                          <Text style={styles.unlockedMetaText}>
                            Desbloqueado {unlockedAt ? new Date(unlockedAt).toLocaleDateString() : 'en el Nexo'}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.progressBarWrapper}>
                          <View style={styles.progressValueRow}>
                            <Text style={[styles.progressValText, { color: theme.textMuted }]}>
                              Progreso: {Math.min(currentValue, targetValue)} / {targetValue} {achievement.unit}
                            </Text>
                            <Text style={[styles.progressPercentText, { color: theme.primary }]}>
                              {progressPercent}%
                            </Text>
                          </View>
                          <View style={[styles.progressTrack, { backgroundColor: theme.cardHighlight }]}>
                            <View
                              style={[
                                styles.progressFill,
                                {
                                  width: `${progressPercent}%`,
                                  backgroundColor: theme.primary,
                                },
                              ]}
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* SECCIÓN 2: SELECTOR DE TEMAS POR FACCIÓN / DOMINIO      */}
        {/* ======================================================== */}
        {activeTab === 'themes' && (
          <View style={styles.sectionWrapper}>
            <View style={[styles.themesHeaderBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.themesHeaderTop}>
                <View>
                  <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
                    Sintonía de Facción
                  </Text>
                  <Text style={[styles.sectionSubheading, { color: theme.textMuted }]}>
                    Elige el dominio elemental que impregna la energía y colores de tu interfaz.
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.themeModePill,
                    { backgroundColor: theme.cardHighlight, borderColor: theme.cardBorder },
                  ]}
                  onPress={handleToggleMode}
                >
                  <Ionicons
                    name={mode === 'dark' ? 'moon' : 'sunny'}
                    size={16}
                    color={mode === 'dark' ? '#FBBF24' : '#F59E0B'}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.themeModePillText, { color: theme.textPrimary }]}>
                    {mode === 'dark' ? 'Oscuro' : 'Claro'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Cuadrícula / Tarjetas de Facciones de Riftbound */}
            <View style={styles.factionsGrid}>
              {factionsList.map(item => {
                const isSelected = faction === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.factionCard,
                      {
                        backgroundColor: theme.card,
                        borderColor: isSelected ? item.primaryColor : theme.cardBorder,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => handleSelectFaction(item.key)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.factionTopRow}>
                      <View style={[styles.factionIconCircle, { backgroundColor: item.primaryColor }]}>
                        <Ionicons name={item.iconName as any} size={20} color="#FFFFFF" />
                      </View>

                      {isSelected ? (
                        <View style={[styles.selectedPill, { backgroundColor: item.primaryColor }]}>
                          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                          <Text style={styles.selectedPillText}>Activo</Text>
                        </View>
                      ) : (
                        <View style={styles.swatchRow}>
                          <View style={[styles.colorSwatch, { backgroundColor: item.primaryColor }]} />
                          <View style={[styles.colorSwatch, { backgroundColor: item.accentColor }]} />
                        </View>
                      )}
                    </View>

                    <Text style={[styles.factionName, { color: theme.textPrimary }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.factionDesc, { color: theme.textMuted }]} numberOfLines={2}>
                      {item.subtitle}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* SECCIÓN 3: AMIGOS Y SOCIAL                             */}
        {/* ======================================================== */}
        {activeTab === 'friends' && (
          <View style={styles.sectionWrapper}>
            {/* Input buscar amigo */}
            <View style={[styles.searchFriendContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Ionicons name="search" size={18} color={theme.textMuted} style={styles.searchFriendIcon} />
              <TextInput
                style={[styles.searchFriendInput, { color: theme.textPrimary }]}
                value={searchFriendText}
                onChangeText={setSearchFriendText}
                placeholder="Buscar el nombre de un amigo..."
                placeholderTextColor={theme.textMuted}
              />
              {searchFriendText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchFriendText('')}>
                  <Ionicons name="close-circle" size={18} color={theme.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Formulario rápido para añadir amigo */}
            {isAddingFriend && (
              <View style={styles.addFriendForm}>
                <TextInput
                  style={[
                    styles.addFriendInput,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.primary,
                      color: theme.textPrimary,
                    },
                  ]}
                  value={newFriendInput}
                  onChangeText={setNewFriendInput}
                  placeholder="Escribe el nombre de usuario de tu amigo..."
                  placeholderTextColor={theme.textMuted}
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.confirmAddBtn, { backgroundColor: theme.primary }]}
                  onPress={handleAddFriend}
                >
                  <Text style={styles.confirmAddText}>Enviar</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Action Row */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.addFriendsBtn, { backgroundColor: theme.primary }]}
                onPress={() => setIsAddingFriend(!isAddingFriend)}
                activeOpacity={0.8}
              >
                <Text style={styles.addFriendsBtnText}>
                  {isAddingFriend ? 'Cancelar' : 'Añadir Invocador'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.refreshBtn,
                  { backgroundColor: theme.card, borderColor: theme.cardBorder },
                ]}
                onPress={() => Alert.alert('Sincronizado', 'Lista de amigos actualizada con el Nexo.')}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Lista de amigos */}
            <View style={styles.friendsSection}>
              {filteredFriends.length === 0 ? (
                <View style={styles.emptyFriendsBox}>
                  <Ionicons name="people-outline" size={40} color={theme.textMuted} />
                  <Text style={[styles.emptyFriendsText, { color: theme.textMuted }]}>
                    No se encontraron invocadores con ese nombre.
                  </Text>
                </View>
              ) : (
                filteredFriends.map(friend => (
                  <View
                    key={friend.id}
                    style={[styles.friendCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  >
                    <View style={styles.friendAvatarContainer}>
                      <Image source={{ uri: friend.avatarUrl }} style={styles.friendAvatar} />
                      <View
                        style={[
                          styles.statusDot,
                          friend.status === 'online' && styles.statusOnline,
                          friend.status === 'in_game' && styles.statusInGame,
                          friend.status === 'offline' && styles.statusOffline,
                          { borderColor: theme.card },
                        ]}
                      />
                    </View>

                    <View style={styles.friendInfo}>
                      <View style={styles.friendNameRow}>
                        <Text style={[styles.friendUsername, { color: theme.textPrimary }]}>
                          {friend.username}
                        </Text>
                        <View style={[styles.friendLevelBadge, { backgroundColor: theme.cardHighlight }]}>
                          <Text style={[styles.friendLevelText, { color: theme.primary }]}>
                            Nv. {friend.level}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.friendSubtext, { color: theme.textMuted }]}>
                        {friend.status === 'online' && 'En línea'}
                        {friend.status === 'in_game' && `Jugando con ${friend.activeDeckName || 'Mazo'}`}
                        {friend.status === 'offline' && 'Desconectado'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.friendActionBtn}
                      onPress={() =>
                        Alert.alert('Invocador', `¿Qué deseas hacer con ${friend.username}?`, [
                          { text: 'Ver Colección', onPress: () => {} },
                          { text: 'Desafiar a Partida', onPress: () => {} },
                          {
                            text: 'Eliminar',
                            style: 'destructive',
                            onPress: () => removeFriend(friend.id),
                          },
                          { text: 'Cancelar', style: 'cancel' },
                        ])
                      }
                    >
                      <Ionicons name="ellipsis-vertical" size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal de edición de perfil */}
      <EditProfileModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginRight: 10,
  },
  rankSmallBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  rankSmallText: {
    fontSize: 10,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeToggleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  iconBtn: {
    marginLeft: 12,
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 12,
  },
  profileSection: {
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    backgroundColor: '#1E293B',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#090D14',
  },
  usernameTouchable: {
    alignItems: 'center',
  },
  usernameText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  editSubtext: {
    fontSize: 12,
    marginTop: 3,
    fontWeight: '500',
  },
  taglineBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  taglineText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 14,
    width: '100%',
    justifyContent: 'space-around',
    borderWidth: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 15,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '70%',
    alignSelf: 'center',
  },
  tabSelectorContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabSelectorItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeTabSelectorItem: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  tabSelectorText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  sectionWrapper: {
    marginBottom: 16,
  },
  summonerRankCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  rankHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  rankIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankTitleCol: {
    flex: 1,
  },
  rankLevelSub: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  rankMainTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  xpBadgeBox: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  xpBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  rankProgressContainer: {
    marginBottom: 12,
  },
  rankProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  rankProgressLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  rankProgressValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  rankProgressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  rankProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  achievementsSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementsSummaryText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
  },
  categoryChipsScroll: {
    paddingBottom: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  achievementsList: {
    gap: 10,
  },
  achievementCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
  },
  badgeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  achievementCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  xpTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  xpTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  achievementCardDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
  },
  unlockedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unlockedMetaText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  progressBarWrapper: {},
  progressValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressValText: {
    fontSize: 10,
    fontWeight: '500',
  },
  progressPercentText: {
    fontSize: 10,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  themesHeaderBox: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  themesHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubheading: {
    fontSize: 11,
    marginTop: 2,
    maxWidth: 220,
  },
  themeModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  themeModePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  factionsGrid: {
    gap: 10,
  },
  factionCard: {
    borderRadius: 16,
    padding: 14,
  },
  factionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  factionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  selectedPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 3,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 6,
  },
  colorSwatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  factionName: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  factionDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  searchFriendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
  },
  searchFriendIcon: {
    marginRight: 10,
  },
  searchFriendInput: {
    flex: 1,
    fontSize: 13,
  },
  addFriendForm: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addFriendInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    marginRight: 8,
  },
  confirmAddBtn: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  confirmAddText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  addFriendsBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  addFriendsBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendsSection: {},
  emptyFriendsBox: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyFriendsText: {
    fontSize: 12,
    marginTop: 8,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  friendAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  statusOnline: {
    backgroundColor: '#10B981',
  },
  statusInGame: {
    backgroundColor: '#F59E0B',
  },
  statusOffline: {
    backgroundColor: '#64748B',
  },
  friendInfo: {
    flex: 1,
  },
  friendNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendUsername: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 8,
  },
  friendLevelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  friendLevelText: {
    fontSize: 10,
    fontWeight: '700',
  },
  friendSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  friendActionBtn: {
    padding: 8,
  },
});
