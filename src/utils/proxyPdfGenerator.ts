import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Deck, DeckCardSlot } from '@/types/deck';
import { MissingCardDetail } from '@/utils/deckCollectionAnalysis';

export interface ProxyCardItem {
  id: string;
  name: string;
  count: number;
  imageUrl?: string;
  primaryDomain?: string;
  energyCost?: number;
  cardType?: string;
  rulesText?: string;
  power?: number;
  might?: number;
  health?: number;
  publicCode?: string;
  section?: string;
}

export type PaperSize = 'letter' | 'a4';

export interface ProxyPdfOptions {
  deckName?: string;
  includeCutLines?: boolean;
  paperSize?: PaperSize;
  mode?: 'missing' | 'all';
}

/**
 * Convierte un mazo completo de Riftbound en una lista plana de ProxyCardItem
 */
export function extractDeckProxyItems(deck: Deck): ProxyCardItem[] {
  const items: ProxyCardItem[] = [];

  const addSlot = (slot: DeckCardSlot, sectionName: string) => {
    if (!slot.card || slot.count <= 0) return;
    const card = slot.card;
    items.push({
      id: card.id || slot.cardId,
      name: card.name,
      count: slot.count,
      imageUrl: card.highresUrl || card.imageUrl || card.thumbnailUrl,
      primaryDomain: card.primaryDomain || card.domains?.[0] || 'Order',
      energyCost: card.energyCost,
      cardType: card.type || card.cardType,
      rulesText: card.rulesText,
      power: card.power ?? card.might,
      might: card.might,
      health: card.health,
      publicCode: card.publicCode,
      section: sectionName,
    });
  };

  // Carta Leyenda
  if (deck.legendCard) {
    items.push({
      id: deck.legendCard.id,
      name: deck.legendCard.name,
      count: 1,
      imageUrl: deck.legendCard.highresUrl || deck.legendCard.imageUrl || deck.legendCard.thumbnailUrl,
      primaryDomain: deck.legendCard.primaryDomain || deck.legendCard.domains?.[0] || 'Order',
      energyCost: deck.legendCard.energyCost,
      cardType: 'Legend',
      rulesText: deck.legendCard.rulesText,
      power: deck.legendCard.power ?? deck.legendCard.might,
      might: deck.legendCard.might,
      health: deck.legendCard.health,
      publicCode: deck.legendCard.publicCode,
      section: 'Leyenda',
    });
  }

  // Battlefields
  (deck.battlefields || []).forEach(s => addSlot(s, 'Battlefield'));

  // Main Deck
  (deck.mainUnits || []).forEach(s => addSlot(s, 'Unidad'));
  (deck.mainGear || []).forEach(s => addSlot(s, 'Gear'));
  (deck.mainSpells || []).forEach(s => addSlot(s, 'Hechizo'));

  // Sideboard
  (deck.sideboard || []).forEach(s => addSlot(s, 'Sideboard'));

  return items;
}

/**
 * Convierte las cartas faltantes de un análisis en ProxyCardItem
 */
export function extractMissingProxyItems(
  missingCards: MissingCardDetail[],
  deck?: Deck
): ProxyCardItem[] {
  return missingCards.map(mc => {
    // Si tenemos acceso al mazo, intentar buscar los detalles adicionales de la carta
    let fullCard = null;
    if (deck) {
      const allSlots = [
        ...(deck.battlefields || []),
        ...(deck.mainUnits || []),
        ...(deck.mainGear || []),
        ...(deck.mainSpells || []),
        ...(deck.sideboard || []),
      ];
      fullCard = allSlots.find(s => s.cardId === mc.cardId)?.card;
      if (!fullCard && deck.legendCard?.id === mc.cardId) {
        fullCard = deck.legendCard;
      }
    }

    return {
      id: mc.cardId,
      name: mc.name,
      count: mc.missing,
      imageUrl: mc.imageUrl || fullCard?.highresUrl || fullCard?.imageUrl,
      primaryDomain: fullCard?.primaryDomain || fullCard?.domains?.[0] || 'Order',
      energyCost: fullCard?.energyCost,
      cardType: fullCard?.type || fullCard?.cardType || mc.section,
      rulesText: fullCard?.rulesText,
      power: fullCard?.power ?? fullCard?.might,
      might: fullCard?.might,
      health: fullCard?.health,
      publicCode: fullCard?.publicCode,
      section: mc.section,
    };
  });
}

/**
 * Expande la lista de cartas repitiendo cada una tantas veces como su `count`
 */
export function expandCardCopies(cards: ProxyCardItem[]): ProxyCardItem[] {
  const expanded: ProxyCardItem[] = [];
  for (const item of cards) {
    const qty = Math.max(1, Math.floor(item.count || 1));
    for (let i = 0; i < qty; i++) {
      expanded.push({ ...item, count: 1 });
    }
  }
  return expanded;
}

/**
 * Colores temáticos según dominio de Riftbound
 */
const DOMAIN_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  fury: { border: '#EF4444', bg: '#450a0a', text: '#FCA5A5' },
  calm: { border: '#3B82F6', bg: '#082f49', text: '#93C5FD' },
  mind: { border: '#A855F7', bg: '#3b0764', text: '#D8B4FE' },
  body: { border: '#10B981', bg: '#022c22', text: '#6EE7B7' },
  chaos: { border: '#F59E0B', bg: '#451a03', text: '#FCD34D' },
  order: { border: '#E2E8F0', bg: '#1e293b', text: '#F8FAFC' },
};

function getDomainStyle(domain?: string) {
  const key = (domain || 'order').toLowerCase();
  return DOMAIN_COLORS[key] || DOMAIN_COLORS.order;
}

function escapeHtml(str?: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Genera el documento HTML completo con páginas de 3x3 (9 cartas por hoja)
 * a medidas TCG exactas (63mm x 88mm).
 */
export function generateProxyHtml(
  cards: ProxyCardItem[],
  options: ProxyPdfOptions = {}
): string {
  const {
    deckName = 'Mazo Riftbound',
    includeCutLines = true,
    paperSize = 'letter',
  } = options;

  const individualCards = expandCardCopies(cards);
  const totalCards = individualCards.length;
  const cardsPerPage = 9;
  const totalPages = Math.max(1, Math.ceil(totalCards / cardsPerPage));

  // Dimensiones según tamaño de papel
  // Carta: 215.9mm x 279.4mm | A4: 210mm x 297mm
  const isLetter = paperSize === 'letter';
  const pageWidth = isLetter ? '215.9mm' : '210mm';
  const pageHeight = isLetter ? '279.4mm' : '297mm';

  let pagesHtml = '';

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const pageCards = individualCards.slice(
      pageIdx * cardsPerPage,
      (pageIdx + 1) * cardsPerPage
    );

    // Rellenar con huecos vacíos si la última página no tiene 9 cartas
    while (pageCards.length < cardsPerPage) {
      pageCards.push({
        id: `empty-${pageCards.length}`,
        name: '',
        count: 0,
      });
    }

    const cardsHtml = pageCards
      .map((card, slotIndex) => {
        if (!card.name || card.count === 0) {
          return `<div class="card empty-slot ${includeCutLines ? 'with-cut-lines' : ''}"></div>`;
        }

        const domainStyle = getDomainStyle(card.primaryDomain);
        const hasImage = Boolean(card.imageUrl);
        const escapedName = escapeHtml(card.name);
        const escapedType = escapeHtml(card.cardType || 'Carta');
        const escapedDomain = escapeHtml(card.primaryDomain || 'Rift');
        const escapedText = escapeHtml(card.rulesText || '');
        const costStr = card.energyCost !== undefined ? String(card.energyCost) : '—';
        const statsStr =
          card.power !== undefined
            ? `⚔ ${card.power}${card.health ? ` / 🛡 ${card.health}` : ''}`
            : '';

        return `
          <div class="card ${includeCutLines ? 'with-cut-lines' : ''}">
            ${
              hasImage
                ? `
                <img
                  src="${card.imageUrl}"
                  alt="${escapedName}"
                  class="card-img"
                  onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                />
                `
                : ''
            }
            <div class="card-fallback" style="${hasImage ? 'display: none;' : 'display: flex;'} border-color: ${domainStyle.border};">
              <div class="fallback-header" style="background: ${domainStyle.bg}; border-color: ${domainStyle.border};">
                <span class="fallback-cost">${costStr}</span>
                <span class="fallback-name">${escapedName}</span>
              </div>
              <div class="fallback-meta">
                <span>${escapedType}</span>
                <span style="color: ${domainStyle.border}; font-weight: bold;">${escapedDomain}</span>
              </div>
              <div class="fallback-body">
                <p class="fallback-text">${escapedText}</p>
              </div>
              <div class="fallback-footer">
                <span class="fallback-badge">PROXY</span>
                <span class="fallback-stats">${statsStr}</span>
              </div>
            </div>
            <div class="proxy-watermark">PROXY • NO COMERCIAL</div>
          </div>
        `;
      })
      .join('');

    pagesHtml += `
      <div class="sheet">
        <div class="sheet-header">
          <span class="sheet-title">Rift Dex • ${escapeHtml(deckName)}</span>
          <span class="sheet-pagination">Hoja ${pageIdx + 1} de ${totalPages} (${totalCards} cartas en total)</span>
          <span class="sheet-instructions">Escala 100% • 63mm x 88mm</span>
        </div>
        <div class="grid-container">
          ${cardsHtml}
        </div>
        <div class="sheet-footer">
          Líneas de corte activadas • Imprime sin "Ajustar al área de impresión" para conservar escala real.
        </div>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>Proxies - ${escapeHtml(deckName)}</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        @page {
          size: ${paperSize} portrait;
          margin: 0;
        }

        body {
          background-color: #f1f5f9;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          margin: 0;
          padding: 0;
        }

        /* Cada hoja de impresión */
        .sheet {
          width: ${pageWidth};
          height: ${pageHeight};
          max-width: ${pageWidth};
          max-height: ${pageHeight};
          page-break-after: always;
          position: relative;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 4mm 0;
        }

        .sheet-header {
          width: 189mm;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 8pt;
          color: #64748b;
          margin-bottom: 2mm;
          border-bottom: 0.5px solid #cbd5e1;
          padding-bottom: 1mm;
        }

        .sheet-title {
          font-weight: 700;
          color: #1e293b;
        }

        .sheet-instructions {
          font-weight: 600;
          color: #3b82f6;
        }

        .sheet-footer {
          width: 189mm;
          margin-top: 2mm;
          text-align: center;
          font-size: 7pt;
          color: #94a3b8;
          border-top: 0.5px solid #cbd5e1;
          padding-top: 1mm;
        }

        /* Cuadrícula de 3x3 cartas (189mm x 264mm) */
        .grid-container {
          width: 189mm;
          height: 264mm;
          display: grid;
          grid-template-columns: repeat(3, 63mm);
          grid-template-rows: repeat(3, 88mm);
          margin: 0 auto;
        }

        /* Carta individual TCG de 63mm x 88mm */
        .card {
          width: 63mm;
          height: 88mm;
          position: relative;
          overflow: hidden;
          background: #090d14;
          display: flex;
          flex-direction: column;
        }

        /* Líneas de corte para tijera o guillotina */
        .card.with-cut-lines {
          outline: 0.25mm dashed rgba(100, 116, 139, 0.45);
          outline-offset: -0.125mm;
        }

        .card.empty-slot {
          background: #f8fafc;
          border: 0.25mm dashed #e2e8f0;
        }

        .card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .proxy-watermark {
          position: absolute;
          bottom: 1.5mm;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(15, 23, 42, 0.85);
          color: #f8fafc;
          font-size: 5.5pt;
          font-weight: 800;
          padding: 0.5mm 2mm;
          border-radius: 1mm;
          letter-spacing: 0.5px;
          pointer-events: none;
          z-index: 5;
          white-space: nowrap;
          border: 0.25mm solid rgba(255, 255, 255, 0.2);
        }

        /* Fallback visual estilizado si la imagen falla o se imprime offline */
        .card-fallback {
          width: 100%;
          height: 100%;
          background: #0f172a;
          color: #f8fafc;
          border: 1.5mm solid #3b82f6;
          border-radius: 2.5mm;
          padding: 2mm;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .fallback-header {
          display: flex;
          align-items: center;
          gap: 1.5mm;
          padding: 1mm 1.5mm;
          border-radius: 1.5mm;
          border: 0.5px solid;
          margin-bottom: 1mm;
        }

        .fallback-cost {
          background: #0f172a;
          color: #f8fafc;
          font-weight: 900;
          font-size: 9pt;
          width: 5mm;
          height: 5mm;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0.5px solid #f8fafc;
        }

        .fallback-name {
          font-weight: 700;
          font-size: 8pt;
          color: #f8fafc;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }

        .fallback-meta {
          display: flex;
          justify-content: space-between;
          font-size: 6.5pt;
          color: #94a3b8;
          padding: 0.5mm 1mm;
          border-bottom: 0.5px solid #334155;
          margin-bottom: 1mm;
        }

        .fallback-body {
          flex: 1;
          background: rgba(15, 23, 42, 0.6);
          border: 0.5px solid #334155;
          border-radius: 1.5mm;
          padding: 1.5mm;
          overflow: hidden;
        }

        .fallback-text {
          font-size: 6pt;
          line-height: 8pt;
          color: #cbd5e1;
        }

        .fallback-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1mm;
        }

        .fallback-badge {
          font-size: 6pt;
          font-weight: 800;
          color: #f59e0b;
        }

        .fallback-stats {
          font-size: 7.5pt;
          font-weight: 800;
          color: #f8fafc;
        }

        @media screen {
          body {
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
          }
          .sheet {
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
            border-radius: 4px;
          }
        }
      </style>
    </head>
    <body>
      ${pagesHtml}
    </body>
    </html>
  `;
}

/**
 * Genera el archivo PDF localmente y devuelve la URI y detalles del documento
 */
export async function generateProxyPdfFile(
  cards: ProxyCardItem[],
  options: ProxyPdfOptions = {}
): Promise<{ uri: string; numberOfPages: number; totalCards: number }> {
  const individualCards = expandCardCopies(cards);
  const totalCards = individualCards.length;
  const numberOfPages = Math.max(1, Math.ceil(totalCards / 9));

  const html = generateProxyHtml(cards, options);

  const file = await Print.printToFileAsync({
    html,
  });

  return {
    uri: file.uri,
    numberOfPages: file.numberOfPages || numberOfPages,
    totalCards,
  };
}

/**
 * Abre el diálogo nativo de impresión (compatible con iOS, Android y Web)
 */
export async function printProxiesDirectly(
  cards: ProxyCardItem[],
  options: ProxyPdfOptions = {}
): Promise<void> {
  const html = generateProxyHtml(cards, options);
  await Print.printAsync({ html });
}

/**
 * Comparte el PDF generado a través del menú de compartir del sistema operativo
 */
export async function shareProxyPdf(
  pdfUri: string,
  dialogTitle: string = 'Compartir Proxies de Riftbound (PDF)'
): Promise<boolean> {
  if (Platform.OS === 'web') {
    // En Web, expo-sharing no suele estar disponible; abrimos la URI en una pestaña nueva o simulamos descarga
    if (typeof window !== 'undefined') {
      window.open(pdfUri, '_blank');
      return true;
    }
    return false;
  }

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    return false;
  }

  await Sharing.shareAsync(pdfUri, {
    UTI: '.pdf',
    mimeType: 'application/pdf',
    dialogTitle,
  });

  return true;
}
