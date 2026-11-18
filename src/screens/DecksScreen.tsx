import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDecks } from '@/context/DeckContext';
import { DeckListItem } from '@/components/decks/DeckListItem';
import { DeckDetailView } from '@/components/decks/DeckDetailView';
import { CreateDeckModal } from '@/components/decks/CreateDeckModal';
import { ImportDeckModal } from '@/components/decks/ImportDeckModal';
import { CommunityHubScreen } from '@/screens/CommunityHubScreen';
import { Deck } from '@/types/deck';

export const DecksScreen: React.FC = () => {
  const {
    decks,
    selectedDeck,
    setSelectedDeckId,
    createDeck,
    importDeck,
    duplicateDeck,
    updateDeck,
    deleteDeck,
  } = useDecks();

  const [activeTab, setActiveTab] = useState<'mine' | 'top' | 'public'>('mine');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [validationModalErrors, setValidationModalErrors] = useState<string[] | null>(null);

  // Si hay un mazo seleccionado, mostramos la vista detallada (Screenshots 6-9)
  if (selectedDeck) {
    return (
      <DeckDetailView
        deck={selectedDeck}
        onBack={() => setSelectedDeckId(null)}
        onEditDeck={updates => {
          if (updates) {
            updateDeck(selectedDeck.id, updates);
          }
        }}
        onDuplicateDeck={async () => {
          try {
            const cloned = await duplicateDeck(selectedDeck.id);
            setSelectedDeckId(cloned.id);
            Alert.alert('¡Mazo Duplicado!', `Se creó exitosamente la variante "${cloned.name}".`);
          } catch (e) {
            Alert.alert('Error', 'No se pudo duplicar el mazo.');
          }
        }}
        onDeleteDeck={() => {
          deleteDeck(selectedDeck.id);
          setSelectedDeckId(null);
        }}
      />
    );
  }

  const filteredDecks = decks.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <View style={styles.container}>
      {/* Top Header Fiel a Screenshot 5 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mazos</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.importPill}
            onPress={() => setIsImportModalOpen(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="download-outline" size={14} color="#3B82F6" style={{ marginRight: 4 }} />
            <Text style={styles.importPillText}>Importar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sortPill}>
            <Ionicons name="pulse-outline" size={14} color="#CBD5E1" style={{ marginRight: 4 }} />
            <Text style={styles.sortPillText}>Más recientes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="filter-outline" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input Fiel a Screenshot 5 */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar un mazo"
          placeholderTextColor="#64748B"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs Chips: [Mis mazos] [Mejores mazos] [Públicos] Fiel a Screenshot 5 */}
      <View style={styles.tabChipsRow}>
        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'mine' && styles.tabChipActive]}
          onPress={() => setActiveTab('mine')}
        >
          <Text style={[styles.tabChipText, activeTab === 'mine' && styles.tabChipTextActive]}>
            Mis mazos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'top' && styles.tabChipActive]}
          onPress={() => setActiveTab('top')}
        >
          <Text style={[styles.tabChipText, activeTab === 'top' && styles.tabChipTextActive]}>
            Mejores mazos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'public' && styles.tabChipActive]}
          onPress={() => setActiveTab('public')}
        >
          <Text style={[styles.tabChipText, activeTab === 'public' && styles.tabChipTextActive]}>
            Públicos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Deck List Fiel a Screenshot 5 */}
      {activeTab === 'top' ? (
        <CommunityHubScreen
          initialTab="meta"
          onBack={() => setActiveTab('mine')}
        />
      ) : activeTab === 'public' ? (
        <CommunityHubScreen
          initialTab="community"
          onBack={() => setActiveTab('mine')}
        />
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {filteredDecks.map(deck => (
              <DeckListItem
                key={deck.id}
                deck={deck}
                onPress={() => setSelectedDeckId(deck.id)}
                onShowValidationErrors={errors => setValidationModalErrors(errors)}
              />
            ))}
          </ScrollView>

          {/* Floating Action Button '+' Fiel a Screenshot 5 */}
          <TouchableOpacity
            style={styles.floatingAddBtn}
            onPress={() => setIsCreateModalOpen(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </>
      )}

      {/* Modal para Crear Mazo */}
      <CreateDeckModal
        visible={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={async (name, description, color, icon) => {
          const newDeck = await createDeck({
            name,
            description,
            color,
            icon,
            domains: ['fury'],
          });
          setIsCreateModalOpen(false);
          setSelectedDeckId(newDeck.id);
        }}
      />

      {/* Modal para Importar Mazo */}
      <ImportDeckModal
        visible={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={async (importedDeck: Deck) => {
          const created = await importDeck(importedDeck);
          setIsImportModalOpen(false);
          setSelectedDeckId(created.id);
        }}
      />

      {/* Modal explicativo de errores de reglamento */}
      <Modal
        visible={!!validationModalErrors}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setValidationModalErrors(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.validationCard}>
            <View style={styles.validationHeader}>
              <Ionicons name="warning" size={28} color="#EF4444" />
              <Text style={styles.validationTitle}>Reglamento Oficial Riftbound</Text>
            </View>

            <Text style={styles.validationSubtitle}>
              Este mazo no cumple con los requisitos del reglamento oficial:
            </Text>

            <ScrollView style={styles.errorsScroll}>
              {validationModalErrors?.map((err, idx) => (
                <View key={idx} style={styles.errorBulletRow}>
                  <Ionicons name="close-circle" size={16} color="#EF4444" style={{ marginTop: 2 }} />
                  <Text style={styles.errorBulletText}>{err}</Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeValidationBtn}
              onPress={() => setValidationModalErrors(null)}
            >
              <Text style={styles.closeValidationText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D14',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  importPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  importPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1522',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  sortPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  filterBtn: {
    backgroundColor: '#0F1522',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1522',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  tabChipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0F1522',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  tabChipActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#2563EB',
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E9AA8',
  },
  tabChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 90,
  },
  floatingAddBtn: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1D4ED8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  validationCard: {
    backgroundColor: '#0F1522',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  validationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  validationTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EF4444',
    marginLeft: 8,
  },
  validationSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 12,
  },
  errorsScroll: {
    maxHeight: 180,
    marginBottom: 16,
  },
  errorBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  errorBulletText: {
    fontSize: 13,
    color: '#F8FAFC',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  closeValidationBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeValidationText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
