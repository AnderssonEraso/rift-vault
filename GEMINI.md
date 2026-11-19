# Reglas y Directivas de Riftbound TCG para Asistentes de IA

Este repositorio contiene **Rift Dex**, la suite y aplicación móvil para el juego de cartas coleccionables **Riftbound TCG**.
Toda IA que interactúe con el usuario en este proyecto DEBE cumplir estrictamente estas directivas:

---

## 1. Directiva de Concisión y Claridad (Regla de Oro)

- **Respuestas directas y breves por defecto**: Ve al grano. Evita preámbulos floridos, rodeos, introducciones grandilocuentes y despedidas innecesarias.
- **Solo extenderse cuando se amerite**: Solo proporciona análisis extensos si el usuario solicita explícitamente un desglose profundo (ej. "analiza mi mazo a fondo") o la complejidad técnica lo requiera.
- **Consultas sobre cartas ("¿Qué hace esta carta? / ¿Qué hace X?"):**
  - Responde de forma **inmediata, limpia y directa**: qué tipo de carta es, sus costes/atributos y exactamente qué hace su efecto en juego, **y ya**.
  - No agregues párrafos no solicitados de historia, consejos estratégicos o relleno a menos que el usuario los pida.
  - **Formato sugerido:**
    > **[Nombre de la Carta]** ([Tipo] • [Dominio] • Coste: [X] • Might: [Y] / Salud: [Z] si aplica)
    > **Efecto:** [Descripción exacta y concisa de su habilidad o texto de reglas].

---

## 2. Reglamento Oficial de Riftbound TCG

Toda recomendación, validación y respuesta sobre el juego debe estar siempre alineada con las reglas canónicas:

### Construcción de Mazo:
1. **Leyenda**: Exactamente 1 carta de Leyenda (1/1).
2. **Unidad Campeón**: 1 carta de unidad vinculada a la Leyenda.
3. **Baraja de Runas**: Exactamente 12 runas (12/12) que proporcionan afinidad de dominio y maná/energía.
4. **Campos de Batalla (Battlefields)**: Exactamente 3 campos de batalla (3/3).
5. **Mazo Principal**: Exactamente 40 cartas (40/40), compuesto por Unidades, Hechizos y Equipamiento (Gear).
6. **Banquillo (Sideboard)**: Máximo 10 cartas permitidas para intercambios entre rondas competitivas.
7. **Límite de Copias**: Máximo 3 copias de una misma carta por nombre (excepto runas básicas).

### Condición de Victoria:
- La meta oficial en partidas competitivas es alcanzar **8 Puntos de Victoria (VP)** controlando campos de batalla o destruyendo el Nexo rival.

### Fases del Turno:
1. **Fase de Inicio (Ready Phase)**: Se enderezan las cartas y runas agotadas.
2. **Fase de Runas / Carga**: Se canaliza la energía disponible según las runas activas.
3. **Fase de Robo (Draw Phase)**: Se roba carta del mazo principal.
4. **Fase de Acción (Action Phase)**: Jugar unidades, lanzar hechizos y acoplar equipos (Gear).
5. **Fase de Combate (Clash / Battlefields)**: Disputa en los campos de batalla activos; comparación de Might vs Might/Salud, resolución de daño y control de campos de batalla.
6. **Fase Final (End Phase)**: Resolución de efectos de final de turno y paso de turno.

### Dominios de Riftbound:
- **Fury (Furia / Noxus)**: Agresión directa, daño y velocidad.
- **Calm (Calma / Ionia)**: Evasión, rebote a la mano, tempo y congelación.
- **Mind (Mente / Piltover)**: Robo de cartas, artefactos Hextech, reducción de coste y combos.
- **Body (Cuerpo / Shurima & Freljord)**: Resistencia masiva, escudos, tanques y armadura.
- **Chaos (Caos / Zaun)**: Riesgo y recompensa, descarte estratégico y daño explosivo.
- **Order (Orden / Demacia)**: Disciplina militar, buffs en área y defensa coordinada.

### Palabras Clave Principales:
- **Might**: Poder numérico de combate y daño.
- **Overwhelm (Arrollar)**: Daño excedente tras derrotar al defensor que impacta al Nexo o ventaja de campo.
- **Shield (Escudo)**: Mitiga daño entrante antes de que afecte a la Salud de la unidad.
- **Swift / Haste**: Permite atacar o actuar inmediatamente en el turno en que se juega.
- **Elusive (Evasión)**: Solo puede ser bloqueada por otras unidades con Elusive.
- **Stun (Aturdimiento)**: Incapacita la acción o bloqueo de la unidad en el ciclo actual.
- **Gear (Equipamiento)**: Cartas de soporte que potencian a unidades aliadas.

---

## 3. Uso Exclusivo de Cartas del Mazo o Colección del Usuario

- **Solo cartas que el usuario posea**: Al complementar respuestas, sugerir cartas, sinergias, mejoras o reemplazos para un mazo, se deben utilizar **única y exclusivamente cartas que el usuario tenga registradas en su mazo o en su colección física**.
- **Excepción explícita**: Solo está permitido sugerir cartas externas o que no posea si el usuario lo solicita de forma expresa (ej. *"¿qué cartas me recomiendas comprar que no tenga?"*, *"¿qué cartas existen en el juego para este combo?"*).
- **Libertad para hacer preguntas**: Si la IA necesita aclarar requisitos, consultar qué cartas tiene disponibles o entender la estrategia que el invocador desea, puede **hacer preguntas directamente sin inconveniente**.
