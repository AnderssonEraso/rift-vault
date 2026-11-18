import { Deck, DeckCardSlot, DeckRuneSlot } from '@/types/deck';
import { RiftCard } from '@/types/card';
import { Platform, Share } from 'react-native';

/**
 * Paleta de colores predeterminada para personalización de mazos
 */
export const DECK_COLOR_PALETTE = [
  '#3B82F6', // Mind / Azul Nexo
  '#EF4444', // Fury / Rojo Furia
  '#0AC8B9', // Calm / Turquesa Calma
  '#EAB308', // Order / Oro
  '#A855F7', // Shadow / Púrpura
  '#10B981', // Esmeralda / Vida
  '#F97316', // Naranja / Fuego Solar
  '#EC4899', // Rosa Neón
  '#6366F1', // Índigo Místico
  '#64748B', // Acero / Neutral
];

/**
 * Catálogo de iconos disponibles para personalización de mazos
 */
export const DECK_ICON_LIST = [
  'sparkles',
  'flame',
  'water',
  'shield',
  'moon',
  'eye',
  'flash',
  'skull',
  'planet',
  'trophy',
  'leaf',
  'heart',
  'infinite',
  'bonfire',
  'color-wand',
  'diamond',
] as const;

/**
 * Exporta un mazo a texto legible estándar (ideal para Discord, redes y notas)
 */
export function exportDeckToText(deck: Deck): string {
  const lines: string[] = [];

  lines.push(`// Mazo: ${deck.name}`);
  if (deck.description) {
    lines.push(`// Descripción: ${deck.description}`);
  }
  lines.push(`// Dominios: ${deck.domains.join(', ')}`);
  lines.push(`// Color: ${deck.color || '#3B82F6'} | Icono: ${deck.icon || 'sparkles'}`);
  lines.push('');

  // Leyenda
  if (deck.legendCard) {
    lines.push('[Leyenda]');
    lines.push(`1 ${deck.legendCard.name}`);
    lines.push('');
  }

  // Campos de batalla
  if (deck.battlefields && deck.battlefields.length > 0) {
    lines.push('[Campos de Batalla]');
    deck.battlefields.forEach(slot => {
      lines.push(`${slot.count} ${slot.card.name}`);
    });
    lines.push('');
  }

  // Runas
  if (deck.runes && deck.runes.length > 0) {
    lines.push('[Runas]');
    deck.runes.forEach(slot => {
      lines.push(`${slot.count} Runa de ${slot.domain}`);
    });
    lines.push('');
  }

  // Unidades
  if (deck.mainUnits && deck.mainUnits.length > 0) {
    lines.push('[Unidades]');
    deck.mainUnits.forEach(slot => {
      lines.push(`${slot.count} ${slot.card.name}`);
    });
    lines.push('');
  }

  // Hechizos
  if (deck.mainSpells && deck.mainSpells.length > 0) {
    lines.push('[Hechizos]');
    deck.mainSpells.forEach(slot => {
      lines.push(`${slot.count} ${slot.card.name}`);
    });
    lines.push('');
  }

  // Equipamiento / Gear
  if (deck.mainGear && deck.mainGear.length > 0) {
    lines.push('[Equipamiento]');
    deck.mainGear.forEach(slot => {
      lines.push(`${slot.count} ${slot.card.name}`);
    });
    lines.push('');
  }

  // Banquillo
  if (deck.sideboard && deck.sideboard.length > 0) {
    lines.push('[Banquillo]');
    deck.sideboard.forEach(slot => {
      lines.push(`${slot.count} ${slot.card.name}`);
    });
    lines.push('');
  }

  // En consideración
  if (deck.maybeboard && deck.maybeboard.length > 0) {
    lines.push('[En Consideración]');
    deck.maybeboard.forEach(slot => {
      lines.push(`${slot.count} ${slot.card.name}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Exporta un mazo a un código compacto en Base64 (Portabilidad 100% fiel con imágenes y metadatos)
 */
export function exportDeckToCode(deck: Deck): string {
  try {
    const payload = {
      v: 1,
      name: deck.name,
      description: deck.description || '',
      color: deck.color || '#3B82F6',
      icon: deck.icon || 'sparkles',
      domains: deck.domains || ['fury'],
      legendCard: deck.legendCard,
      runes: deck.runes || [],
      battlefields: deck.battlefields || [],
      mainUnits: deck.mainUnits || [],
      mainGear: deck.mainGear || [],
      mainSpells: deck.mainSpells || [],
      sideboard: deck.sideboard || [],
      maybeboard: deck.maybeboard || [],
    };
    const jsonStr = JSON.stringify(payload);
    
    // Codificación segura Base64 para browser y Node
    let base64 = '';
    const nodeBuffer = (globalThis as any).Buffer;
    if (typeof btoa !== 'undefined') {
      base64 = btoa(unescape(encodeURIComponent(jsonStr)));
    } else if (nodeBuffer) {
      base64 = nodeBuffer.from(jsonStr, 'utf-8').toString('base64');
    } else {
      return jsonStr;
    }
    return `RIFT1-${base64}`;
  } catch (e) {
    return JSON.stringify(deck, null, 2);
  }
}

/**
 * Importa y analiza inteligentemente texto pegado (código RIFT1-, JSON o Lista en Texto)
 */
export function parseDeckImport(rawInput: string): {
  success: boolean;
  deck?: Partial<Deck>;
  error?: string;
} {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { success: false, error: 'El contenido está vacío.' };
  }

  // Caso 1: Código RIFT1- Base64
  if (trimmed.startsWith('RIFT1-')) {
    try {
      const b64 = trimmed.replace('RIFT1-', '').trim();
      let jsonStr = '';
      const nodeBuffer = (globalThis as any).Buffer;
      if (typeof atob !== 'undefined') {
        jsonStr = decodeURIComponent(escape(atob(b64)));
      } else if (nodeBuffer) {
        jsonStr = nodeBuffer.from(b64, 'base64').toString('utf-8');
      }
      const data = JSON.parse(jsonStr);
      return {
        success: true,
        deck: {
          name: data.name || 'Mazo Importado',
          description: data.description || '',
          color: data.color || '#3B82F6',
          icon: data.icon || 'sparkles',
          domains: data.domains || ['fury'],
          legendCard: data.legendCard,
          runes: data.runes || [],
          battlefields: data.battlefields || [],
          mainUnits: data.mainUnits || [],
          mainGear: data.mainGear || [],
          mainSpells: data.mainSpells || [],
          sideboard: data.sideboard || [],
          maybeboard: data.maybeboard || [],
        },
      };
    } catch (e) {
      return { success: false, error: 'Código de mazo RIFT1 inválido o corrupto.' };
    }
  }

  // Caso 2: Formato JSON directo
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const data = JSON.parse(trimmed);
      return {
        success: true,
        deck: {
          name: data.name || 'Mazo Importado',
          description: data.description || '',
          color: data.color || '#3B82F6',
          icon: data.icon || 'sparkles',
          domains: data.domains || ['fury'],
          legendCard: data.legendCard,
          runes: data.runes || [],
          battlefields: data.battlefields || [],
          mainUnits: data.mainUnits || [],
          mainGear: data.mainGear || [],
          mainSpells: data.mainSpells || [],
          sideboard: data.sideboard || [],
          maybeboard: data.maybeboard || [],
        },
      };
    } catch (e) {
      return { success: false, error: 'Formato JSON no válido.' };
    }
  }

  // Caso 3: Formato Lista de Texto
  try {
    const lines = trimmed.split('\n');
    let deckName = 'Mazo Importado';
    let deckDesc = '';
    let color = '#3B82F6';
    let icon = 'sparkles';
    const domains: string[] = [];

    const battlefields: DeckCardSlot[] = [];
    const mainUnits: DeckCardSlot[] = [];
    const mainGear: DeckCardSlot[] = [];
    const mainSpells: DeckCardSlot[] = [];
    const sideboard: DeckCardSlot[] = [];
    const maybeboard: DeckCardSlot[] = [];
    const runes: DeckRuneSlot[] = [];
    let legendCard: RiftCard | undefined;

    type SectionType =
      | 'legend'
      | 'battlefields'
      | 'runes'
      | 'units'
      | 'spells'
      | 'gear'
      | 'sideboard'
      | 'maybeboard'
      | 'none';

    let currentSection: SectionType = 'none';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Lectura de comentarios con metadatos
      if (line.startsWith('//')) {
        const lower = line.toLowerCase();
        if (lower.includes('mazo:') || lower.includes('deck:')) {
          deckName = line.split(':')[1]?.trim() || deckName;
        } else if (lower.includes('descripci')) {
          deckDesc = line.split(':')[1]?.trim() || deckDesc;
        } else if (lower.includes('dominios:')) {
          const doms = line.split(':')[1]?.split(',').map(s => s.trim().toLowerCase()) || [];
          domains.push(...doms);
        }
        if (lower.includes('color:')) {
          const matchColor = line.match(/#[0-9a-fA-F]{6}/);
          if (matchColor) color = matchColor[0];
        }
        if (lower.includes('icono:') || lower.includes('icon:')) {
          const iconMatch = line.match(/(?:icono|icon):\s*([a-zA-Z0-9_-]+)/i);
          if (iconMatch) icon = iconMatch[1].trim();
        }
        continue;
      }

      // Detección de cabeceras de sección [Sección]
      if (line.startsWith('[') && line.endsWith(']')) {
        const sec = line.slice(1, -1).toLowerCase();
        if (sec.includes('leyen') || sec.includes('legend')) currentSection = 'legend';
        else if (sec.includes('campo') || sec.includes('battlefield') || sec.includes('landmark'))
          currentSection = 'battlefields';
        else if (sec.includes('runa') || sec.includes('rune')) currentSection = 'runes';
        else if (sec.includes('unidad') || sec.includes('unit') || sec.includes('creature'))
          currentSection = 'units';
        else if (sec.includes('hechizo') || sec.includes('spell')) currentSection = 'spells';
        else if (sec.includes('equipo') || sec.includes('gear') || sec.includes('artefact'))
          currentSection = 'gear';
        else if (sec.includes('banquillo') || sec.includes('side')) currentSection = 'sideboard';
        else if (sec.includes('consideraci') || sec.includes('maybe')) currentSection = 'maybeboard';
        else currentSection = 'spells';
        continue;
      }

      // Parseo de línea de carta: ej. "3 Asesino Sombrío", "3x Yasuo", "1 Runa de Furia"
      const match = line.match(/^(\d+)x?\s+(.+)$/i);
      const count = match ? parseInt(match[1], 10) : 1;
      const cardName = match ? match[2].trim() : line;

      // Sección especial: Runas
      if (currentSection === 'runes' || cardName.toLowerCase().startsWith('runa de ')) {
        const domName = cardName.replace(/runa de /i, '').trim().toLowerCase();
        runes.push({
          id: `rune_${Date.now()}_${runes.length}`,
          domain: domName || 'fury',
          count,
        });
        continue;
      }

      // Mock / placeholder Card para la importación
      const cardPlaceholder: RiftCard = {
        id: `imported_${cardName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: cardName,
        type:
          currentSection === 'units'
            ? 'Unit'
            : currentSection === 'gear'
            ? 'Gear'
            : currentSection === 'battlefields'
            ? 'Battlefield'
            : currentSection === 'legend'
            ? 'Legend'
            : 'Spell',
        domains: domains.length > 0 ? domains : ['fury'],
        primaryDomain: domains[0] || 'fury',
        imageUrl: 'https://via.placeholder.com/400x560/151B26/C8AA6E?text=' + encodeURIComponent(cardName),
      };

      const slot: DeckCardSlot = {
        cardId: cardPlaceholder.id,
        card: cardPlaceholder,
        count,
      };

      if (currentSection === 'legend') {
        legendCard = cardPlaceholder;
      } else if (currentSection === 'battlefields') {
        battlefields.push(slot);
      } else if (currentSection === 'units') {
        mainUnits.push(slot);
      } else if (currentSection === 'gear') {
        mainGear.push(slot);
      } else if (currentSection === 'sideboard') {
        sideboard.push(slot);
      } else if (currentSection === 'maybeboard') {
        maybeboard.push(slot);
      } else {
        // Por defecto va a mainSpells si no se especificó o es sección spells
        mainSpells.push(slot);
      }
    }

    return {
      success: true,
      deck: {
        name: deckName,
        description: deckDesc,
        color,
        icon,
        domains: domains.length > 0 ? domains : ['fury'],
        legendCard,
        runes: runes.length > 0 ? runes : [
          { id: 'r1', domain: 'fury', count: 6, iconName: 'flame' },
          { id: 'r2', domain: 'calm', count: 6, iconName: 'water' },
        ],
        battlefields,
        mainUnits,
        mainGear,
        mainSpells,
        sideboard,
        maybeboard,
      },
    };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Error al procesar el texto del mazo.' };
  }
}

/**
 * Función auxiliar para copiar al portapapeles o compartir
 */
export async function copyOrShareText(text: string, title: string = 'Mazo Riftbound'): Promise<boolean> {
  // En Web: usar navigator.clipboard
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback a share
    }
  }

  // En Native o fallback
  try {
    await Share.share({
      title,
      message: text,
    });
    return true;
  } catch (e) {
    return false;
  }
}
