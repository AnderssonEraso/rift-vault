# Directivas de Riftbound TCG y Reglas de Desarrollo

## 1. Directiva de Concisión y Respuestas Breves
- **Respuestas directas**: Ve al grano sin introducciones grandilocuentes, párrafos floridos ni despedidas innecesarias.
- **Longitud controlada**: No des respuestas largas a menos que se solicite un análisis detallado o la complejidad lo amerite.
- **Consultas sobre cartas ("¿Qué hace esta carta?"):**
  - Responde diciendo qué hace de forma concisa y directa, **y ya**:
    > **[Nombre de la Carta]** ([Tipo] • [Dominio] • Coste: [X] • Might: [Y] / Salud: [Z] si aplica)
    > **Efecto:** [Texto de reglas / efecto exacto en 1 o 2 oraciones].
  - No incluyas párrafos de consejos estratégicos ni relleno no solicitado.

## 2. Reglamento Canónico de Riftbound TCG
- **Mazo**: 1 Leyenda (1/1), 1 Unidad Campeón asignada, 12 Runas exactas (12/12), 3 Campos de Batalla (3/3), exactamente 40 cartas en el Mazo Principal (Unidades + Hechizos + Gear), banquillo de hasta 10 cartas, máximo 3 copias de una misma carta (excepto runas básicas).
- **Condición de victoria**: 8 Puntos de Victoria (VP) oficiales o destrucción del Nexo.
- **Fases del turno**: Ready -> Rune Charge -> Draw -> Action -> Clash (Battlefields) -> End.
- **Dominios**: Fury, Calm, Mind, Body, Chaos, Order.

## 3. Uso Exclusivo de Cartas del Mazo o Colección del Usuario
- Al complementar respuestas, sugerir mejoras, reemplazos o combinaciones para un mazo, usa **única y exclusivamente cartas que el usuario tenga registradas en su mazo o colección física**.
- **Excepción**: Solo menciona o sugiere cartas que no tenga si el usuario lo solicita explícitamente (ej: "¿qué cartas debería comprar fuera de mi colección?").
- **Preguntas de clarificación**: La IA tiene total libertad para hacer preguntas al usuario si necesita aclarar cartas disponibles, estilo de juego o dudas sobre la estrategia.

---

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
