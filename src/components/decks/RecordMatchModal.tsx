import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Deck } from '@/types/deck';
import { DeckMatchRecord } from '@/types/match';

interface RecordMatchModalProps {
  visible: boolean;
  deck: Deck;
  onClose: () => void;
  onSave: (data: Omit<DeckMatchRecord, 'id' | 'createdAt'>) => Promise<any>;
}

export const RecordMatchModal: React.FC<RecordMatchModalProps> = ({
  visible,
  deck,
  onClose,
  onSave,
}) => {
  const [result, setResult] = useState<'win' | 'loss' | 'draw'>('win');
  const [opponentName, setOpponentName] = useState('');
  const [opponentChampion, setOpponentChampion] = useState('');
  const [playerScore, setPlayerScore] = useState(8);
  const [opponentScore, setOpponentScore] = useState(5);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSave({
        deckId: deck.id,
        deckName: deck.name,
        opponentName: opponentName.trim() || 'Oponente',
        opponentChampion: opponentChampion.trim() || undefined,
        result,
        playerScore: Number(playerScore) || 0,
        opponentScore: Number(opponentScore) || 0,
        notes: notes.trim() || undefined,
      });
      // Reset
      setOpponentName('');
      setOpponentChampion('');
      setPlayerScore(8);
      setOpponentScore(5);
      setNotes('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: `${deck.color || '#3B82F6'}22` },
              ]}
            >
              <Ionicons
                name="trophy-outline"
                size={24}
                color={deck.color || '#3B82F6'}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.title}>Registrar Partida</Text>
              <Text style={styles.subtitle}>{deck.name}</Text>
            </View>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Selector de Resultado */}
            <View style={styles.sectionWrapper}>
              <Text style={styles.inputLabel}>RESULTADO DE LA PARTIDA</Text>
              <View style={styles.resultTabsRow}>
                <TouchableOpacity
                  style={[
                    styles.resultTab,
                    result === 'win' && styles.resultTabWin,
                  ]}
                  onPress={() => {
                    setResult('win');
                    setPlayerScore(8);
                  }}
                >
                  <Ionicons
                    name="trophy"
                    size={16}
                    color={result === 'win' ? '#10B981' : '#64748B'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.resultTabText,
                      result === 'win' && styles.resultTabTextWin,
                    ]}
                  >
                    Victoria
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.resultTab,
                    result === 'loss' && styles.resultTabLoss,
                  ]}
                  onPress={() => {
                    setResult('loss');
                    setOpponentScore(8);
                  }}
                >
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={result === 'loss' ? '#EF4444' : '#64748B'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.resultTabText,
                      result === 'loss' && styles.resultTabTextLoss,
                    ]}
                  >
                    Derrota
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.resultTab,
                    result === 'draw' && styles.resultTabDraw,
                  ]}
                  onPress={() => setResult('draw')}
                >
                  <Ionicons
                    name="remove-circle-outline"
                    size={16}
                    color={result === 'draw' ? '#CBD5E1' : '#64748B'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.resultTabText,
                      result === 'draw' && styles.resultTabTextDraw,
                    ]}
                  >
                    Empate
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Marcador final de puntos */}
            <View style={styles.sectionWrapper}>
              <Text style={styles.inputLabel}>MARCADOR FINAL (PUNTOS RIFTBOUND)</Text>
              <View style={styles.scoreRow}>
                <View style={styles.scoreColumn}>
                  <Text style={styles.scoreSubLabel}>Tus Puntos</Text>
                  <View style={styles.scoreCounter}>
                    <TouchableOpacity
                      style={styles.scoreAdjustBtn}
                      onPress={() => setPlayerScore(p => Math.max(0, p - 1))}
                    >
                      <Ionicons name="remove" size={16} color="#CBD5E1" />
                    </TouchableOpacity>
                    <Text style={styles.scoreNumber}>{playerScore}</Text>
                    <TouchableOpacity
                      style={styles.scoreAdjustBtn}
                      onPress={() => setPlayerScore(p => Math.min(20, p + 1))}
                    >
                      <Ionicons name="add" size={16} color="#CBD5E1" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.scoreSeparator}>-</Text>

                <View style={styles.scoreColumn}>
                  <Text style={styles.scoreSubLabel}>Oponente</Text>
                  <View style={styles.scoreCounter}>
                    <TouchableOpacity
                      style={styles.scoreAdjustBtn}
                      onPress={() => setOpponentScore(p => Math.max(0, p - 1))}
                    >
                      <Ionicons name="remove" size={16} color="#CBD5E1" />
                    </TouchableOpacity>
                    <Text style={styles.scoreNumber}>{opponentScore}</Text>
                    <TouchableOpacity
                      style={styles.scoreAdjustBtn}
                      onPress={() => setOpponentScore(p => Math.min(20, p + 1))}
                    >
                      <Ionicons name="add" size={16} color="#CBD5E1" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* Oponente */}
            <View style={styles.sectionWrapper}>
              <Text style={styles.inputLabel}>OPONENTE / RIVAL</Text>
              <TextInput
                style={styles.input}
                value={opponentName}
                onChangeText={setOpponentName}
                placeholder="Nombre o alias del rival..."
                placeholderTextColor="#64748B"
              />
            </View>

            {/* Campeón / Arquetipo rival */}
            <View style={styles.sectionWrapper}>
              <Text style={styles.inputLabel}>CAMPEÓN O MAZO OPONENTE (OPCIONAL)</Text>
              <TextInput
                style={styles.input}
                value={opponentChampion}
                onChangeText={setOpponentChampion}
                placeholder="Ej. Zed Shadow, Shen Calm Control..."
                placeholderTextColor="#64748B"
              />
            </View>

            {/* Notas */}
            <View style={styles.sectionWrapper}>
              <Text style={styles.inputLabel}>NOTAS DE LA PARTIDA</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="¿Qué funcionó bien? ¿Qué cartas clave te ayudaron?"
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={2}
              />
            </View>
          </ScrollView>

          {/* Acciones */}
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>CANCELAR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[
                styles.saveBtn,
                {
                  backgroundColor:
                    result === 'win'
                      ? '#10B981'
                      : result === 'loss'
                      ? '#EF4444'
                      : '#3B82F6',
                },
              ]}
            >
              <Text style={styles.saveText}>GUARDAR PARTIDA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  scrollBody: {
    marginBottom: 12,
  },
  sectionWrapper: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.8,
  },
  resultTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#090D14',
    borderRadius: 10,
    padding: 4,
    gap: 6,
  },
  resultTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  resultTabWin: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  resultTabLoss: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  resultTabDraw: {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    borderColor: '#94A3B8',
  },
  resultTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  resultTabTextWin: {
    color: '#10B981',
    fontWeight: '700',
  },
  resultTabTextLoss: {
    color: '#EF4444',
    fontWeight: '700',
  },
  resultTabTextDraw: {
    color: '#CBD5E1',
    fontWeight: '700',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#090D14',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  scoreColumn: {
    alignItems: 'center',
    flex: 1,
  },
  scoreSubLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 6,
    fontWeight: '600',
  },
  scoreCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 4,
  },
  scoreAdjustBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    paddingHorizontal: 16,
  },
  scoreSeparator: {
    fontSize: 20,
    fontWeight: '700',
    color: '#64748B',
    paddingHorizontal: 8,
  },
  input: {
    backgroundColor: '#090D14',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#F8FAFC',
    fontSize: 13,
  },
  textArea: {
    minHeight: 52,
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  cancelText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 13,
  },
  saveBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
