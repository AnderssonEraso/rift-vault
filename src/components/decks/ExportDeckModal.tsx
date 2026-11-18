import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Deck } from '@/types/deck';
import {
  exportDeckToCode,
  exportDeckToText,
  copyOrShareText,
} from '@/utils/deckExportImport';
import { ProxyGeneratorModal } from '@/components/decks/ProxyGeneratorModal';

interface ExportDeckModalProps {
  visible: boolean;
  deck: Deck;
  onClose: () => void;
}

export const ExportDeckModal: React.FC<ExportDeckModalProps> = ({
  visible,
  deck,
  onClose,
}) => {
  const [format, setFormat] = useState<'code' | 'text'>('code');
  const [copied, setCopied] = useState(false);
  const [isProxyModalOpen, setIsProxyModalOpen] = useState(false);

  const deckCode = exportDeckToCode(deck);
  const deckText = exportDeckToText(deck);
  const currentContent = format === 'code' ? deckCode : deckText;

  const handleCopy = async () => {
    const success = await copyOrShareText(currentContent, `Mazo: ${deck.name}`);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    try {
      await Share.share({
        title: `Mazo Riftbound: ${deck.name}`,
        message: currentContent,
      });
    } catch {
      // Ignorar
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
                name={(deck.icon || 'sparkles') as any}
                size={24}
                color={deck.color || '#3B82F6'}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.title}>Exportar Mazo</Text>
              <Text style={styles.subtitle}>{deck.name}</Text>
            </View>
          </View>

          {/* Selector de formato: [Código RIFT1] vs [Lista de Texto] */}
          <View style={styles.formatTabs}>
            <TouchableOpacity
              style={[styles.formatTab, format === 'code' && styles.formatTabActive]}
              onPress={() => setFormat('code')}
            >
              <Ionicons
                name="qr-code-outline"
                size={16}
                color={format === 'code' ? '#FFFFFF' : '#94A3B8'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.formatTabText,
                  format === 'code' && styles.formatTabTextActive,
                ]}
              >
                Código RIFT1
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.formatTab, format === 'text' && styles.formatTabActive]}
              onPress={() => setFormat('text')}
            >
              <Ionicons
                name="document-text-outline"
                size={16}
                color={format === 'text' ? '#FFFFFF' : '#94A3B8'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.formatTabText,
                  format === 'text' && styles.formatTabTextActive,
                ]}
              >
                Lista en Texto
              </Text>
            </TouchableOpacity>
          </View>

          {/* Información de ayuda según formato */}
          <Text style={styles.formatDescription}>
            {format === 'code'
              ? 'Código compacto y exacto que preserva todos los datos, colores e iconos al importarlo en Rift Dex.'
              : 'Formato estándar legible ideal para compartir en Discord, WhatsApp, foros o imprimir.'}
          </Text>

          {/* Contenedor del contenido exportado */}
          <ScrollView style={styles.contentBox} showsVerticalScrollIndicator={true}>
            <Text style={styles.contentText} selectable>
              {currentContent}
            </Text>
          </ScrollView>

          {/* Banner de Generador de Proxies TCG */}
          <TouchableOpacity
            style={styles.proxyBanner}
            onPress={() => setIsProxyModalOpen(true)}
            activeOpacity={0.85}
          >
            <View style={styles.proxyBannerIcon}>
              <Ionicons name="print" size={20} color="#38BDF8" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.proxyBannerTitle}>Generador de Proxies en PDF</Text>
              <Text style={styles.proxyBannerSubtitle}>
                Hojas 3x3 a escala 100% (63 × 88 mm) con marcas de corte
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#64748B" />
          </TouchableOpacity>

          {/* Acciones */}
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={handleNativeShare} style={styles.shareBtn}>
              <Ionicons name="share-outline" size={18} color="#CBD5E1" />
              <Text style={styles.shareBtnText}>Compartir</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCopy}
              style={[
                styles.copyBtn,
                { backgroundColor: deck.color || '#3B82F6' },
                copied && styles.copyBtnSuccess,
              ]}
            >
              <Ionicons
                name={copied ? 'checkmark-circle' : 'copy-outline'}
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.copyBtnText}>
                {copied ? '¡COPIADO!' : 'COPIAR'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>CERRAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Modal Generador de Proxies */}
      {isProxyModalOpen && (
        <ProxyGeneratorModal
          visible={isProxyModalOpen}
          deck={deck}
          initialMode="all"
          onClose={() => setIsProxyModalOpen(false)}
        />
      )}
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
    marginBottom: 14,
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
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  formatTabs: {
    flexDirection: 'row',
    backgroundColor: '#090D14',
    borderRadius: 10,
    padding: 4,
    marginBottom: 10,
  },
  formatTab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  formatTabActive: {
    backgroundColor: '#1E293B',
  },
  formatTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  formatTabTextActive: {
    color: '#F8FAFC',
  },
  formatDescription: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
    lineHeight: 16,
  },
  contentBox: {
    backgroundColor: '#090D14',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
    maxHeight: 160,
    marginBottom: 14,
  },
  contentText: {
    color: '#94A3B8',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  proxyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090D14',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  proxyBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proxyBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  proxyBannerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
  },
  shareBtnText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  copyBtnSuccess: {
    backgroundColor: '#10B981',
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
});
