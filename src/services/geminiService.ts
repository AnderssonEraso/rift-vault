import { GeminiModelId, AIContextConfig, AIMessage, AIValidationResult, AIModelItem } from '@/types/ai';
import { UserProfile } from '@/types/profile';
import { Deck } from '@/types/deck';
import { FolderCardItem } from '@/types/collection';

export const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Normaliza y construye la URL completa de llamada a generateContent.
 * Soporta tanto URLs completas como nombres de modelos simples.
 */
export function buildModelCallUrl(endpointUrlOrModel: string, apiKey: string): string {
  let url = (endpointUrlOrModel || '').trim();
  const cleanKey = apiKey.trim();

  if (!url) {
    url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent';
  } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const clean = url.replace(/^models\//, '');
    url = `${GEMINI_API_ENDPOINT}/${clean}:generateContent`;
  } else if (!url.includes(':generateContent')) {
    url = `${url.replace(/\/+$/, '')}:generateContent`;
  }

  // Si ya tiene parámetros de query, se añade con '&', de lo contrario con '?'
  const separator = url.includes('?') ? '&' : '?';
  // Si la url no tiene el parámetro key, se lo adjuntamos
  if (!url.includes('key=')) {
    url = `${url}${separator}key=${encodeURIComponent(cleanKey)}`;
  }
  return url;
}

/**
 * Valida una API Key de Google AI Studio realizando una consulta de generación real.
 * Utiliza exactamente el endpoint y cabecera 'x-goog-api-key' que provee Google AI Studio.
 */
export async function validateGeminiApiKey(
  apiKey: string,
  modelOrUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent'
): Promise<AIValidationResult> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return { isValid: false, error: 'La API Key no puede estar vacía.' };
  }

  // Modelos ordenados por prioridad de compatibilidad
  const endpointsToTry: string[] = [
    modelOrUrl,
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  ];

  const uniqueEndpoints = Array.from(new Set(endpointsToTry));
  let lastErrorMsg = '';

  for (const testEndpoint of uniqueEndpoints) {
    try {
      const url = buildModelCallUrl(testEndpoint, cleanKey);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': cleanKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: 'Hola' }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 5,
            temperature: 0.1,
          },
        }),
      });

      if (response.ok) {
        const modelName = testEndpoint.split('/').pop()?.replace(':generateContent', '') || 'gemini-3.5-flash-lite';
        return { isValid: true, modelUsed: modelName };
      }

      const errData = await response.json().catch(() => null);
      const msg = errData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;

      // Si la clave es inválida o expirada en Google, salimos con el mensaje claro
      if (response.status === 400 && msg.toLowerCase().includes('api key')) {
        return {
          isValid: false,
          error: `Google AI Studio: ${msg}`,
        };
      }

      if (response.status === 403) {
        return {
          isValid: false,
          error: `Google AI Studio (Permisos): ${msg}`,
        };
      }

      lastErrorMsg = msg;
    } catch (e: any) {
      lastErrorMsg = e?.message || 'Error de conexión';
    }
  }

  // Si ninguno funcionó por POST directo, consultamos la lista de modelos permitidos
  try {
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(cleanKey)}`;
    const listRes = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'x-goog-api-key': cleanKey,
      },
    });

    if (listRes.ok) {
      const data = await listRes.json().catch(() => null);
      const availableModels: any[] = data?.models || [];
      const generateModel = availableModels.find((m: any) =>
        m.supportedGenerationMethods?.includes('generateContent')
      );

      if (generateModel) {
        const cleanName = generateModel.name.replace(/^models\//, '');
        return { isValid: true, modelUsed: cleanName };
      }

      // Si la lista de modelos respondió 200, la clave es válida en Google
      return {
        isValid: true,
        modelUsed: 'gemini-3.5-flash-lite',
      };
    } else {
      const errData = await listRes.json().catch(() => null);
      return {
        isValid: false,
        error: errData?.error?.message || 'API Key no válida en Google AI Studio.',
      };
    }
  } catch (err: any) {
    return {
      isValid: false,
      error: `Error de conexión con Google AI Studio: ${lastErrorMsg || err?.message}`,
    };
  }
}

export interface BuildContextOptions {
  profile?: UserProfile;
  decks?: Deck[];
  collectionItems?: FolderCardItem[];
  contextConfig?: AIContextConfig;
  currentDeckFocus?: Deck;
}

/**
 * Construye el contexto del sistema (System Prompt) con toda la información
 * enriquecida del juego, las reglas oficiales y los datos del invocador.
 */
export function buildRiftDexSystemContext(options: BuildContextOptions): string {
  const { profile, decks, collectionItems, contextConfig, currentDeckFocus } = options;

  const sections: string[] = [];

  // 1. Identidad y Misión del Asistente
  sections.push(`Eres el "Oráculo del Nexo", el consejero táctico e inteligencia artificial oficial de Rift-Dex para el juego de cartas coleccionables Riftbound TCG.
Tu propósito es ayudar al invocador a:
- Analizar y optimizar la construcción de mazos (curva de energía, balance entre unidades, hechizos y equipos).
- Sugerir sinergias basadas en las leyendas y los dominios mágicos.
- Resolver dudas sobre las reglas oficiales de combate, campos de batalla y control de nexos.
- Dar recomendaciones personalizadas aprovechando su colección de cartas real.
Responde con un tono épico, estratégico, claro y motivador. Cuando menciones cartas, resalta su nombre entre comillas o negrita.`);

  // 2. Reglas Oficiales y Dominios de Riftbound TCG
  if (contextConfig?.includeGameRules !== false) {
    sections.push(`### Reglas de Construcción y Juego de Riftbound TCG:
1. Leyenda: Cada mazo tiene exactamente 1 carta de Leyenda que define el héroe y habilidades clave.
2. Runas: La baraja de runas debe contener exactamente 12 cartas de runas que generan maná/energía.
3. Campos de Batalla (Battlefields): El mazo debe tener exactamente 3 campos de batalla activos sobre los cuales se combate.
4. Mazo Principal: Contiene Unidades (criaturas de combate), Hechizos (spells rápidos o tácticos) y Equipos (Gear para equipar).
5. Límite de Copias: Máximo 3 copias de una misma carta por nombre en todo el mazo (excepto runas básicas).
6. Banquillo (Sideboard): Máximo 10 cartas permitidas para intercambios entre rondas en partidas oficiales.
7. Dominios mágicos:
- Fury (Furia/Noxus): Agresión pura, daño directo y velocidad.
- Calm (Calma/Ionia): Evasión, rebote, control de tempo y congelación.
- Mind (Mente/Piltover): Robo de cartas, artefactos Hextech y combos.
- Body (Cuerpo/Shurima & Freljord): Estadísticas masivas, escudos y armadura.
- Chaos (Caos/Zaun): Riesgo y recompensa, descarte y daño explosivo.
- Order (Orden/Demacia): Disciplina, buffs grupales y perseverancia.`);

    sections.push(`### Compendio Canónico de Leyendas y Habilidades de Riftbound TCG:
Cuando el invocador consulte sobre cualquier Leyenda, responde siempre con su ficha técnica completa, habilidades exactas y sinergias tácticas (incluso si no la tiene aún en su inventario):

* **Jinx, la Bala Perdida (Dominio: Caos / Zaun)**:
  - **Identidad:** Hiper-agresiva ("Burn & Empty Hand"). Se especializa en vaciar la mano rápidamente para desatar efectos devastadores.
  - **Habilidad Pasiva de Leyenda - ¡A Toda Máquina! (Get Excited!):** Al vaciar tu mano o jugar la última carta de tu mano durante el turno, todas tus unidades aliadas ganan **+2 Might** y robas 1 carta adicional al final del turno.
  - **Habilidad Activa / Firma - ¡Supermegacohete Mortal! (Super Mega Death Rocket!):** *(Coste 2 de Energía)* Inflige 3 de daño directo al Nexo rival o 5 de daño a una unidad en cualquier campo de batalla. Si tu mano tiene menos cartas que la de tu rival, inflige 2 de daño adicional en área a todas las unidades enemigas en ese campo de batalla.
  - **Sinergias clave:** *Forjador de Zaun*, *Chispazo Hextech*, *Mascafuegos Explosivos*, cartas de bajo coste y daño directo.

* **K'Sante, el Orgullo de Nazumah (Dominio: Cuerpo / Shurima)**:
  - **Identidad:** Tanque titánico defensivo que puede transicionar a modo berserker destructivo.
  - **Habilidad Pasiva de Leyenda - Firmeza de Nazumah:** Tus unidades ganan +1 de Vida y un Escudo Protector al defender campos de batalla disputados.
  - **Habilidad Activa / Firma - ¡Con Todo! (All Out):** Transforma la defensa de K'Sante en ataque: sacrifica el 50% de la vida de tu tablero para otorgar **+4 Might** y **Arrollar (Overwhelm)** a K'Sante, reduciendo el coste de todas las cartas de Equipo (Gear) a 0 durante este turno.
  - **Sinergias clave:** *Ntofos de Entono*, *Baluarte Desértico*, *Escudo Titánico*.

* **Vi, Destructora de Piltover (Dominio: Furia / Piltover)**:
  - **Habilidad:** *Rompecorazas (Denting Blows)*: Ignora escudos enemigos y acumula +1 Might permanente en cada ataque consecutivo.
  - **Firma:** *Asalto y Lesiones*: Carga contra la unidad enemiga más poderosa en combate anulando su contraataque.

* **Zed, Maestro de las Sombras (Dominio: Mente / Ionia)**:
  - **Habilidad:** *Sombra Viviente*: Invoca un clon que replica los hechizos tácticos y permite golpear evadiendo el daño de represalia.
  - **Firma:** *Marca de la Muerte*: Aplica una marca letal que detona al final de la ronda repitiendo el 100% del daño infligido.

* **Ahri, la Zorra de Nueve Colas (Dominio: Calma / Ionia)**:
  - **Habilidad:** *Encanto Espiritual*: Regresa unidades enemigas a la mano de su dueño y recoloca unidades aliadas entre campos de batalla.

* **Garen, Poder de Demacia (Dominio: Orden / Demacia)**:
  - **Habilidad:** *Perseverancia & Juicio*: Escudos automáticos para aliados al comienzo del combate y daño en área rotatorio.

* **Aatrox, la Espada de los Oscuros (Dominio: Caos / Darkin)**:
  - **Habilidad:** *Masacre del Destructor*: Cura tu nexo con el daño infligido y resucita unidades Darkin caídas.

* **Malphite, Fragmento del Monolito (Dominio: Cuerpo / Targon)**:
  - **Habilidad:** *Fuerza Imparable*: En turnos 5+, aturde y deja indefenso el campo de batalla enemigo completo.

* **Yasuo, la Espada Huérfana (Dominio: Calma / Furia)**:
  - **Habilidad:** *Último Aliento*: Ataques adicionales inmediatos cada vez que un enemigo es aturdido o desplazado.

* **Darius, la Mano de Noxus (Dominio: Furia / Noxus)**:
  - **Habilidad:** *Guillotina Noxiana*: Ejecuta instantáneamente unidades enemigas que tengan la mitad o menos de su salud.`);
  }

  // 3. Perfil del Invocador
  if (contextConfig?.includeProfile && profile) {
    sections.push(`### Datos del Invocador:
- Nombre: ${profile.username}
- Título/Tagline: ${profile.tagline || 'Invocador del Nexo'}
- Partidas Jugadas: ${profile.stats.matchesPlayed} | Victorias: ${profile.stats.matchesWon} (Win Rate: ${profile.stats.winRate}%)
- Total Cartas Registradas: ${profile.stats.cardsOwned}
- Total Mazos Creados: ${profile.stats.decksBuilt}`);
  }

  // 4. Mazo enfocado (si el usuario está inspeccionando o consultando sobre un mazo particular)
  if (currentDeckFocus) {
    const deck = currentDeckFocus;
    const unitsList = deck.mainUnits?.map(u => `${u.count}x ${u.card.name} (Coste ${u.card.energyCost ?? '?'})`).join(', ') || 'Ninguna';
    const spellsList = deck.mainSpells?.map(s => `${s.count}x ${s.card.name} (Coste ${s.card.energyCost ?? '?'})`).join(', ') || 'Ninguno';
    const gearList = deck.mainGear?.map(g => `${g.count}x ${g.card.name} (Coste ${g.card.energyCost ?? '?'})`).join(', ') || 'Ninguno';
    const battlefieldsList = deck.battlefields?.map(b => `${b.count}x ${b.card.name}`).join(', ') || 'Sin definir';
    const runesList = deck.runes?.map(r => `${r.count}x Runa ${r.domain}`).join(', ') || 'Sin definir';

    sections.push(`### MAZO EN ANÁLISIS ACTUAL:
- Nombre del Mazo: "${deck.name}"
- Leyenda Asignada: ${deck.legendCard?.name || 'Sin leyenda asignada'}
- Dominios: ${deck.domains?.join(', ') || 'Incoloro'}
- Runas (Total ${deck.runes?.reduce((a, b) => a + b.count, 0) || 0}/12): ${runesList}
- Campos de Batalla (Total ${deck.battlefields?.reduce((a, b) => a + b.count, 0) || 0}/3): ${battlefieldsList}
- Unidades: ${unitsList}
- Hechizos: ${spellsList}
- Equipos (Gear): ${gearList}`);
  }

  // 5. Lista de Mazos Guardados del Usuario
  if (contextConfig?.includeDecks && decks && decks.length > 0) {
    const summary = decks
      .slice(0, 10)
      .map(
        d =>
          `- "${d.name}" (Leyenda: ${d.legendCard?.name || 'Ninguna'}, Dominios: ${d.domains?.join('/') || 'Neutro'})`
      )
      .join('\n');
    sections.push(`### Mazos en el Inventario del Jugador (${decks.length} mazos):\n${summary}`);
  }

  // 6. Resumen de la Colección del Usuario
  if (contextConfig?.includeCollection && collectionItems && collectionItems.length > 0) {
    const totalCount = collectionItems.reduce((acc, it) => acc + (it.regularCount || 0) + (it.foilCount || 0), 0);
    const uniqueCount = collectionItems.length;
    const sampleCards = collectionItems
      .slice(0, 15)
      .map(it => `${it.card.name} (${it.card.rarity || 'Común'})`)
      .join(', ');

    sections.push(`### Colección del Invocador:
- Posee ${totalCount} copias totales de ${uniqueCount} cartas distintas.
- Cartas destacadas en su colección: ${sampleCards}${uniqueCount > 15 ? '...' : ''}.`);
  }

  // 7. Instrucciones personalizadas del usuario
  if (contextConfig?.customInstructions && contextConfig.customInstructions.trim()) {
    sections.push(`### Instrucciones Especiales del Usuario:
${contextConfig.customInstructions.trim()}`);
  }

  return sections.join('\n\n');
}

export interface GenerateContentParams {
  apiKey: string;
  model?: string;
  endpointUrl?: string;
  fallbackEndpoints?: string[];
  systemInstruction?: string;
  prompt: string;
  history?: AIMessage[];
  temperature?: number;
}

/**
 * Llama a la API de Google AI Studio (Gemini) para generar contenido.
 * Utiliza el endpointUrl configurado para el modelo seleccionado.
 * Si el modelo elegido experimenta alta demanda temporal (high demand / 503 / 429),
 * conmuta a los endpoints de fallback alternativos de forma transparente.
 */
export async function generateGeminiContent(params: GenerateContentParams): Promise<string> {
  const {
    apiKey,
    model = 'gemini-3.5-flash-lite',
    endpointUrl,
    fallbackEndpoints = [],
    systemInstruction,
    prompt,
    history = [],
    temperature = 0.7,
  } = params;

  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error('API Key de Google AI Studio no proporcionada. Configúrala en tu perfil.');
  }

  // Si no se proporcionó endpointUrl, lo construimos a partir del model
  const primaryEndpoint = endpointUrl || (model.startsWith('http') ? model : `${GEMINI_API_ENDPOINT}/${model.replace(/^models\//, '')}:generateContent`);

  // Endpoints a probar en cascada
  const endpointsSequence: string[] = [
    primaryEndpoint,
    ...fallbackEndpoints,
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  ];

  const uniqueEndpoints = Array.from(new Set(endpointsSequence));

  // Estructurar historial de mensajes para Gemini
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  // Agregar los últimos mensajes del historial (hasta 12 mensajes para mantener agilidad)
  const recentHistory = history.slice(-12);
  for (const msg of recentHistory) {
    contents.push({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    });
  }

  // Agregar el mensaje actual del usuario
  contents.push({
    role: 'user',
    parts: [{ text: prompt }],
  });

  const requestBody: any = {
    contents,
    generationConfig: {
      temperature,
      topP: 0.95,
      maxOutputTokens: 4096,
    },
  };

  if (systemInstruction && systemInstruction.trim()) {
    requestBody.system_instruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  let lastErrorDetail = '';

  for (const currentEndpoint of uniqueEndpoints) {
    const url = buildModelCallUrl(currentEndpoint, cleanKey);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': cleanKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        const candidate = data.candidates?.[0];

        // Concatenar todos los bloques de texto devueltos por el modelo
        const fullText = candidate?.content?.parts
          ?.map((p: any) => p.text || '')
          .filter(Boolean)
          .join('')
          .trim();

        if (!fullText) {
          if (candidate?.finishReason === 'SAFETY') {
            throw new Error('La respuesta fue bloqueada por los filtros de seguridad de Google AI Studio.');
          }
          throw new Error('No se recibió texto generado por Google AI Studio.');
        }

        return fullText;
      }

      const errorBody = await response.json().catch(() => null);
      const msg = errorBody?.error?.message || `Error HTTP ${response.status}: ${response.statusText}`;
      lastErrorDetail = msg;

      // Si es un error de alta demanda (high demand / 503 / 429), continuamos al siguiente modelo de la cascada
      const isHighDemand =
        response.status === 503 ||
        response.status === 429 ||
        msg.toLowerCase().includes('high demand') ||
        msg.toLowerCase().includes('overloaded') ||
        msg.toLowerCase().includes('resource has been exhausted');

      if (isHighDemand) {
        console.warn(`⚡ Endpoint ${currentEndpoint} con alta demanda en Google, cambiando automáticamente a modelo alternativo...`);
        continue;
      }

      // Si es error de clave no válida o permisos, no tiene sentido probar los demás
      if (response.status === 401 || response.status === 403 || msg.toLowerCase().includes('api_key') || msg.toLowerCase().includes('api key not valid')) {
        throw new Error(`Error de autenticación con Google AI Studio: ${msg}`);
      }
    } catch (err: any) {
      if (err.message?.includes('filtros de seguridad') || err.message?.includes('API Key no válida')) {
        throw err;
      }
      lastErrorDetail = err?.message || 'Error de conexión';
    }
  }

  throw new Error(
    `Los servidores de Google AI Studio están experimentando alta demanda momentánea. (${lastErrorDetail}). Intenta enviar tu mensaje nuevamente en unos segundos.`
  );
}

