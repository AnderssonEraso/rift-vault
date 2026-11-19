import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useAI } from '@/context/AIContext';
import { Deck } from '@/types/deck';
import { MarkdownRenderer } from './MarkdownRenderer';

interface OracleModalProps {
  visible: boolean;
  onClose: () => void;
  initialDeckFocus?: Deck | null;
  onNavigateToSettings?: () => void;
}

export const OracleModal: React.FC<OracleModalProps> = ({
  visible,
  onClose,
  initialDeckFocus = null,
  onNavigateToSettings,
}) => {
  const { theme } = useTheme();
  const {
    isConfigured,
    activeModel,
    activeModelItem,
    messages,
    isGenerating,
    askOracle,
    clearChat,
    getPreviewContext,
  } = useAI();

  const [inputText, setInputText] = useState('');
  const [deckFocus, setDeckFocus] = useState<Deck | null>(initialDeckFocus);
  const [showContextPreview, setShowContextPreview] = useState(false);
  const scrollViewRef = useRef<any>(null);

  useEffect(() => {
    if (initialDeckFocus) {
      setDeckFocus(initialDeckFocus);
    }
  }, [initialDeckFocus]);

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [visible, messages]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isGenerating) return;

    setInputText('');
    try {
      await askOracle(text, deckFocus || undefined);
    } catch (e) {
      // El error ya es manejado y colocado en el chat por AIContext
    }
  };

  const quickPrompts = [
    {
      icon: 'card-outline',
      label: '¿Qué hace una carta?',
      prompt: '¿Qué hace la carta Jinx y cuáles son sus habilidades?',
    },
    {
      icon: 'help-circle-outline',
      label: 'Explicar reglas de combate y campos',
      prompt: 'Explícame de forma concisa cómo funcionan los campos de batalla y cómo se ganan los 8 puntos de victoria en Riftbound TCG.',
    },
    {
      icon: 'analytics-outline',
      label: deckFocus ? `Analizar mazo "${deckFocus.name}"` : 'Evaluar curva y balance de mazo',
      prompt: deckFocus
        ? `Analiza de forma concisa mi mazo "${deckFocus.name}". Evalúa curva de energía y recomiéndame 2 mejoras puntuales.`
        : 'Analiza mis mazos guardados y dime cuál tiene mejor balance competitivo en 3 puntos clave.',
    },
    {
      icon: 'sparkles-outline',
      label: 'Joyas de mi colección',
      prompt: 'Dime de forma breve qué cartas destacadas de mi colección debería priorizar en mis mazos.',
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header Superior del Oráculo */}
        <View style={[styles.header, { borderBottomColor: theme.cardBorder, backgroundColor: theme.card }]}>
          <View style={styles.headerTitleRow}>
            <View style={[styles.oracleOrb, { backgroundColor: theme.primary + '25', borderColor: theme.primary }]}>
              <Ionicons name="sparkles" size={18} color={theme.primary} />
            </View>
            <View>
              <View style={styles.titleBadgeRow}>
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Oráculo del Nexo</Text>
                <View style={[styles.modelPill, { backgroundColor: theme.cardHighlight }]}>
                  <Text style={[styles.modelPillText, { color: theme.primary }]}>
                    {activeModelItem?.name?.toUpperCase() || activeModel.replace('gemini-', '').toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
                Google AI Studio • Asistente Táctico
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: theme.cardHighlight }]}
              onPress={() => setShowContextPreview(!showContextPreview)}
              activeOpacity={0.7}
            >
              <Ionicons name="code-working-outline" size={18} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: theme.cardHighlight }]}
              onPress={clearChat}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={18} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Banner de Mazo enfocado (si aplica) */}
        {deckFocus && (
          <View style={[styles.deckFocusBanner, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '40' }]}>
            <Ionicons name="layers" size={16} color={theme.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.deckFocusText, { color: theme.textPrimary }]} numberOfLines={1}>
              Mazo en análisis: <Text style={{ fontWeight: '700', color: theme.primary }}>{deckFocus.name}</Text>
            </Text>
            <TouchableOpacity onPress={() => setDeckFocus(null)} style={styles.removeFocusBtn}>
              <Ionicons name="close-circle" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Modal / Acordeón para inspeccionar el Contexto que se manda por debajo */}
        {showContextPreview && (
          <View style={[styles.contextInspectBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.inspectHeader}>
              <Text style={[styles.inspectTitle, { color: theme.textPrimary }]}>
                Contexto enviado por debajo a Gemini
              </Text>
              <TouchableOpacity onPress={() => setShowContextPreview(false)}>
                <Ionicons name="close" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.inspectScroll}>
              <Text style={[styles.inspectText, { color: theme.textSecondary }]}>
                {getPreviewContext(deckFocus || undefined)}
              </Text>
            </ScrollView>
          </View>
        )}

        {/* Si no está configurada la API key, mostrar alerta de onboarding */}
        {!isConfigured && (
          <View style={[styles.unconfiguredBanner, { backgroundColor: '#F59E0B20', borderColor: '#F59E0B50' }]}>
            <Ionicons name="warning-outline" size={22} color="#F59E0B" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.unconfiguredTitle, { color: '#F59E0B' }]}>
                API Key de Google AI Studio requerida
              </Text>
              <Text style={[styles.unconfiguredDesc, { color: theme.textSecondary }]}>
                Para chatear con el Oráculo necesitas agregar tu clave gratuita de Google AI Studio.
              </Text>
            </View>
            {onNavigateToSettings && (
              <TouchableOpacity
                style={[styles.configureNowBtn, { backgroundColor: '#F59E0B' }]}
                onPress={() => {
                  onClose();
                  onNavigateToSettings();
                }}
              >
                <Text style={styles.configureNowText}>Configurar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Lista de Mensajes */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesScroll}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(msg => {
            const isUser = msg.role === 'user';
            return (
              <View
                key={msg.id}
                style={[
                  styles.messageRow,
                  isUser ? styles.messageRowUser : styles.messageRowModel,
                ]}
              >
                {!isUser && (
                  <View style={[styles.msgAvatar, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}>
                    <Ionicons name="sparkles" size={14} color={theme.primary} />
                  </View>
                )}

                <View
                  style={[
                    styles.messageBubble,
                    isUser
                      ? [styles.userBubble, { backgroundColor: theme.primary }]
                      : [styles.modelBubble, { backgroundColor: theme.card, borderColor: theme.cardBorder }],
                  ]}
                >
                  {msg.deckAttached && (
                    <View style={styles.attachedDeckBadge}>
                      <Ionicons name="layers-outline" size={11} color={isUser ? '#FFFFFF' : theme.primary} style={{ marginRight: 4 }} />
                      <Text style={[styles.attachedDeckText, { color: isUser ? '#FFFFFF' : theme.primary }]}>
                        {msg.deckAttached.name}
                      </Text>
                    </View>
                  )}
                  <MarkdownRenderer content={msg.text} isUser={isUser} />
                </View>
              </View>
            );
          })}

          {isGenerating && (
            <View style={[styles.messageRow, styles.messageRowModel]}>
              <View style={[styles.msgAvatar, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}>
                <Ionicons name="sparkles" size={14} color={theme.primary} />
              </View>
              <View style={[styles.messageBubble, styles.modelBubble, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <View style={styles.thinkingRow}>
                  <ActivityIndicator size="small" color={theme.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.thinkingText, { color: theme.textMuted }]}>
                    El Oráculo está consultando el Nexo...
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Chips de Prompts Rápidos */}
        <View style={styles.quickPromptsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPromptsScroll}>
            {quickPrompts.map((qp, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.quickChip, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                onPress={() => handleSend(qp.prompt)}
                disabled={isGenerating || !isConfigured}
                activeOpacity={0.7}
              >
                <Ionicons name={qp.icon as any} size={14} color={theme.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.quickChipText, { color: theme.textSecondary }]}>
                  {qp.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input Bar Inferior */}
        <View style={[styles.inputBar, { backgroundColor: theme.card, borderTopColor: theme.cardBorder }]}>
          <TextInput
            style={[
              styles.chatInput,
              {
                backgroundColor: theme.cardHighlight,
                borderColor: theme.cardBorder,
                color: theme.textPrimary,
              },
            ]}
            placeholder={
              isConfigured
                ? 'Pregunta qué hace una carta, reglas o mazos...'
                : 'Configura tu clave en el perfil para chatear...'
            }
            placeholderTextColor={theme.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            editable={!isGenerating && isConfigured}
            maxLength={1000}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: theme.primary },
              (!inputText.trim() || isGenerating || !isConfigured) && { opacity: 0.5 },
            ]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isGenerating || !isConfigured}
            activeOpacity={0.8}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  oracleOrb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modelPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modelPillText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: 6,
    marginLeft: 4,
  },
  deckFocusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  deckFocusText: {
    fontSize: 12,
    flex: 1,
  },
  removeFocusBtn: {
    padding: 4,
  },
  contextInspectBox: {
    margin: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    maxHeight: 180,
  },
  inspectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inspectTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  inspectScroll: {
    maxHeight: 130,
  },
  inspectText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 14,
  },
  unconfiguredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  unconfiguredTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  unconfiguredDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  configureNowBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  configureNowText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowModel: {
    justifyContent: 'flex-start',
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  messageBubble: {
    borderRadius: 14,
    padding: 12,
    maxWidth: '82%',
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  modelBubble: {
    borderTopLeftRadius: 4,
    borderWidth: 1,
  },
  attachedDeckBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  attachedDeckText: {
    fontSize: 11,
    fontWeight: '700',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
  },
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thinkingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  quickPromptsWrapper: {
    paddingVertical: 8,
  },
  quickPromptsScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    maxHeight: 100,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
