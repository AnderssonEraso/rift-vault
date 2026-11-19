import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface MarkdownRendererProps {
  content: string;
  isUser?: boolean;
}

/**
 * Renderiza texto enriquecido en Markdown nativo para React Native:
 * - Encabezados (#, ##, ###)
 * - Negrita (**texto** o __texto__)
 * - Cursiva (*texto* o _texto_)
 * - Negrita y Cursiva (***texto***)
 * - Código inline (`código`)
 * - Bloques de código (```código```)
 * - Listas con viñetas (- item, * item, • item)
 * - Listas numeradas (1. item)
 * - Citas en bloque (> cita)
 * - Separadores horizontales (---)
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isUser = false }) => {
  const { theme } = useTheme();

  const textColor = isUser ? '#FFFFFF' : theme.textPrimary;
  const mutedColor = isUser ? 'rgba(255, 255, 255, 0.75)' : theme.textMuted;
  const codeBg = isUser ? 'rgba(0, 0, 0, 0.25)' : theme.cardHighlight;
  const borderColor = isUser ? 'rgba(255, 255, 255, 0.3)' : theme.cardBorder;

  // Parsea texto inline con negrita, cursiva y código
  const renderInlineFormattedText = (text: string, baseStyle?: any) => {
    // Regex para capturar ***bold-italic***, **bold**, *italic*, `code`
    const regex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_|`[^`]+`)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      // ***Negrita y Cursiva***
      if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
        const inner = part.slice(3, -3);
        return (
          <Text key={index} style={[baseStyle, styles.boldItalic, { color: textColor }]}>
            {inner}
          </Text>
        );
      }

      // **Negrita** o __Negrita__
      if (
        (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
        (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
      ) {
        const inner = part.slice(2, -2);
        return (
          <Text key={index} style={[baseStyle, styles.bold, { color: isUser ? '#FFFFFF' : theme.textPrimary }]}>
            {inner}
          </Text>
        );
      }

      // *Cursiva* o _Cursiva_
      if (
        (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
        (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
      ) {
        const inner = part.slice(1, -1);
        return (
          <Text key={index} style={[baseStyle, styles.italic, { color: textColor }]}>
            {inner}
          </Text>
        );
      }

      // `Código Inline`
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        const inner = part.slice(1, -1);
        return (
          <Text
            key={index}
            style={[
              baseStyle,
              styles.inlineCode,
              {
                backgroundColor: codeBg,
                color: isUser ? '#FFFFFF' : theme.primary,
                borderColor: borderColor,
              },
            ]}
          >
            {inner}
          </Text>
        );
      }

      // Texto plano
      return (
        <Text key={index} style={[baseStyle, { color: textColor }]}>
          {part}
        </Text>
      );
    });
  };

  // Parsea el contenido en bloques (párrafos, encabezados, listas, bloques de código, etc.)
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detección de inicio / fin de bloque de código (```)
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // Cierre de bloque de código
        const codeText = codeBlockContent.join('\n');
        elements.push(
          <View
            key={`code-block-${i}`}
            style={[
              styles.codeBlockContainer,
              { backgroundColor: isUser ? 'rgba(0, 0, 0, 0.35)' : theme.cardHighlight, borderColor },
            ]}
          >
            {codeBlockLang ? (
              <View style={[styles.codeBlockHeader, { borderBottomColor: borderColor }]}>
                <Text style={[styles.codeLangText, { color: mutedColor }]}>{codeBlockLang.toUpperCase()}</Text>
              </View>
            ) : null}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text
                selectable
                style={[
                  styles.codeBlockText,
                  { color: isUser ? '#FFFFFF' : theme.textPrimary },
                ]}
              >
                {codeText}
              </Text>
            </ScrollView>
          </View>
        );
        inCodeBlock = false;
        codeBlockContent = [];
        codeBlockLang = '';
        continue;
      } else {
        // Inicio de bloque de código
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
        codeBlockContent = [];
        continue;
      }
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    const trimmed = line.trim();

    // Línea vacía / espacio entre párrafos
    if (!trimmed) {
      elements.push(<View key={`spacer-${i}`} style={styles.paragraphSpacer} />);
      continue;
    }

    // Separador horizontal (--- o ***)
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      elements.push(
        <View
          key={`hr-${i}`}
          style={[styles.horizontalRule, { backgroundColor: borderColor }]}
        />
      );
      continue;
    }

    // Encabezado 1 (# Titulo)
    if (line.startsWith('# ')) {
      elements.push(
        <View key={`h1-${i}`} style={styles.headingBox}>
          <Text style={[styles.h1, { color: isUser ? '#FFFFFF' : theme.textPrimary }]}>
            {renderInlineFormattedText(line.slice(2).trim(), styles.h1)}
          </Text>
        </View>
      );
      continue;
    }

    // Encabezado 2 (## Titulo)
    if (line.startsWith('## ')) {
      elements.push(
        <View key={`h2-${i}`} style={styles.headingBox}>
          <Text style={[styles.h2, { color: isUser ? '#FFFFFF' : theme.textPrimary }]}>
            {renderInlineFormattedText(line.slice(3).trim(), styles.h2)}
          </Text>
        </View>
      );
      continue;
    }

    // Encabezado 3 (### Titulo)
    if (line.startsWith('### ')) {
      elements.push(
        <View key={`h3-${i}`} style={styles.headingBox}>
          <Text style={[styles.h3, { color: isUser ? '#FFFFFF' : theme.primary }]}>
            {renderInlineFormattedText(line.slice(4).trim(), styles.h3)}
          </Text>
        </View>
      );
      continue;
    }

    // Cita en bloque (> cita)
    if (line.startsWith('> ') || line === '>') {
      const quoteText = line.startsWith('> ') ? line.slice(2) : '';
      elements.push(
        <View
          key={`blockquote-${i}`}
          style={[
            styles.blockquote,
            {
              borderLeftColor: isUser ? '#FFFFFF' : theme.primary,
              backgroundColor: isUser ? 'rgba(255, 255, 255, 0.1)' : theme.cardHighlight + '60',
            },
          ]}
        >
          <Text style={[styles.blockquoteText, { color: textColor }]}>
            {renderInlineFormattedText(quoteText, styles.blockquoteText)}
          </Text>
        </View>
      );
      continue;
    }

    // Lista con viñetas (- item, * item, • item)
    if (
      line.startsWith('- ') ||
      line.startsWith('* ') ||
      line.startsWith('• ')
    ) {
      const itemText = line.slice(2).trim();
      elements.push(
        <View key={`bullet-${i}`} style={styles.listItemRow}>
          <Text style={[styles.bulletDot, { color: isUser ? '#FFFFFF' : theme.primary }]}>•</Text>
          <Text style={[styles.listItemText, { color: textColor }]}>
            {renderInlineFormattedText(itemText, styles.listItemText)}
          </Text>
        </View>
      );
      continue;
    }

    // Lista numerada (1. item, 2. item...)
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      const num = numberedMatch[1];
      const itemText = numberedMatch[2];
      elements.push(
        <View key={`num-${i}`} style={styles.listItemRow}>
          <Text style={[styles.bulletNum, { color: isUser ? '#FFFFFF' : theme.primary }]}>
            {num}.
          </Text>
          <Text style={[styles.listItemText, { color: textColor }]}>
            {renderInlineFormattedText(itemText, styles.listItemText)}
          </Text>
        </View>
      );
      continue;
    }

    // Párrafo de texto estándar
    elements.push(
      <Text key={`p-${i}`} style={[styles.paragraph, { color: textColor }]}>
        {renderInlineFormattedText(line, styles.paragraph)}
      </Text>
    );
  }

  return <View style={styles.container}>{elements}</View>;
};

// Componente ScrollView horizontal importado condicionalmente o usado de react-native
import { ScrollView } from 'react-native';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 4,
  },
  paragraphSpacer: {
    height: 8,
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  boldItalic: {
    fontWeight: '700',
    fontStyle: 'italic',
  },
  inlineCode: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12.5,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  headingBox: {
    marginTop: 8,
    marginBottom: 6,
  },
  h1: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  h3: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    paddingLeft: 4,
  },
  bulletDot: {
    fontSize: 16,
    lineHeight: 20,
    marginRight: 8,
    fontWeight: '700',
  },
  bulletNum: {
    fontSize: 13,
    lineHeight: 20,
    marginRight: 6,
    fontWeight: '700',
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  blockquote: {
    borderLeftWidth: 3,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginVertical: 6,
  },
  blockquoteText: {
    fontSize: 13.5,
    fontStyle: 'italic',
    lineHeight: 19,
  },
  horizontalRule: {
    height: 1,
    width: '100%',
    marginVertical: 10,
  },
  codeBlockContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: 8,
  },
  codeBlockHeader: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomWidth: 1,
  },
  codeLangText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  codeBlockText: {
    padding: 10,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 17,
  },
});
