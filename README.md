# ⚡ Rift Dex — Tu Asistente Integral para Riftbound TCG

<p align="center">
  <img src="assets/images/icon.png" width="110" height="110" alt="Rift Dex Logo" style="border-radius: 24px;" />
</p>

<p align="center">
  <b>La aplicación definitiva para jugadores, coleccionistas y constructores de mazos del juego de cartas coleccionables Riftbound TCG.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-SDK_58-000020?style=for-the-badge&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/React_Native-0.88-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/React-19.3-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-Database_%26_Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Platforms-Android_%7C_iOS_%7C_Web-orange?style=for-the-badge" />
</p>

---

## 📖 Índice

- [Visión General](#-visión-general)
- [Funcionalidades Principales](#-funcionalidades-principales)
  - [1. Explorador de Cartas en Tiempo Real](#1-explorador-de-cartas-en-tiempo-real)
  - [2. Gestor de Colección e Inventario Físico](#2-gestor-de-colección-e-inventario-físico)
  - [3. Constructor y Gestor de Mazos (Deck Builder)](#3-constructor-y-gestor-de-mazos-deck-builder)
  - [4. Cruce con Colección Física ("¿Puedo armarlo en físico?")](#4-cruce-con-colección-física-puedo-armarlo-en-físico)
  - [5. Seguimiento de Partidas y Winrate (Match Tracker)](#5-seguimiento-de-partidas-y-winrate-match-tracker)
  - [6. Sistema de Importación, Exportación y Duplicación](#6-sistema-de-importación-exportación-y-duplicación)
  - [7. Herramientas de Juego: Contador y Calculadora de Intercambios](#7-herramientas-de-juego-contador-y-calculadora-de-intercambios)
  - [8. Autenticación Híbrida y Perfil de Invocador](#8-autenticación-híbrida-y-perfil-de-invocador)
- [Reglamento Oficial Riftbound Integrado](#-reglamento-oficial-riftbound-integrado)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Variables de Entorno](#-variables-de-entorno)
- [Scripts Disponibles](#-scripts-disponibles)

---

## 🌟 Visión General

**Rift Dex** es una suite completa diseñada para la comunidad de **Riftbound TCG**, desarrollada con React Native, Expo y Supabase. Permite consultar el catálogo oficial de cartas con precios de mercado actualizados, gestionar tu inventario físico por carpetas, construir mazos con validación automática del reglamento competitivo, analizar si puedes armar un mazo con las cartas que tienes físicamente, llevar un registro de partidas y winrate por mazo, simular intercambios justos y llevar la puntuación en vivo durante partidas de 1 a 4 jugadores.

---

## 🚀 Funcionalidades Principales

### 1. Explorador de Cartas en Tiempo Real
- **Conexión Directa con OpenRift API**: Catálogo oficial universal sincronizado con datos e imágenes en alta resolución.
- **Filtros Avanzados Multicriterio**:
  - **Dominios / Facciones**: Furia (*Fury*), Calma (*Calm*), Mente (*Mind*), Cuerpo (*Body*), Caos (*Chaos*) y Orden (*Order*).
  - **Tipos de Carta**: Leyendas (*Legends*), Unidades (*Units*), Hechizos (*Spells*), Equipamiento (*Gear*), Runas (*Runes*) y Campos de Batalla (*Battlefields*).
  - **Coste de Energía, Fuerza (*Might*) y Rarezas**.
- **Búsqueda Dinámica con Debounce y Paginación Infinita**.
- **Ficha Detallada de Carta (Modal)**: Muestra arte completo, texto de reglas, citas de trasfondo (*flavor text*), atributos, precios en USD/EUR (versiones normal y *foil*) y accesos rápidos para agregar a carpetas de colección o a tus mazos.

---

### 2. Gestor de Colección e Inventario Físico
- **Organización por Carpetas Personalizadas**: Crea carpetas (ej. *"Carpeta de Intercambio"*, *"Joyas Raras"*, *"Mazo Principal"*) con nombres, colores e iconos propios.
- **Control de Copias Normales y Foil**: Rastreo independiente de cartas estándar y reflectantes.
- **Valoración de Cartera en Tiempo Real**: Resumen con valor total estimado en dólares ($ USD), cartas únicas y copias acumuladas.
- **Modificación Rápida de Inventario**: Botones de adición y sustracción rápida (+1/-1) sin fricción.
- **Almacenamiento Híbrido**: Persistencia inmediata en caché local (`AsyncStorage`) y sincronización automática en la nube con Supabase.

---

### 3. Constructor y Gestor de Mazos (Deck Builder)
- **Validación Automática del Reglamento Oficial Riftbound**:
  - ✅ **1 Carta de Leyenda** obligatoria (1/1).
  - ✅ **12 Runas exactas** (12/12).
  - ✅ **3 Campos de Batalla** exactos (3/3).
  - ✅ **40 Cartas en el Mazo Principal** (40/40) divididas en Unidades, Hechizos y Equipamiento.
  - ✅ **Regla de 3 copias máximas** por carta (excepto runas básicas).
  - ✅ **Banquillo (*Sideboard*)** de hasta 10 cartas y sección **En consideración (*Maybeboard*)**.
- **Curva de Maná Interactiva**: Histograma visual de costes de energía para optimizar el ritmo de juego.
- **Personalización Visual Total**:
  - **10 Colores Temáticos** (Azul Nexo, Rojo Furia, Turquesa Calma, Oro Orden, Púrpura Sombrío, etc.).
  - **16 Iconos Distintivos** (`flame`, `sparkles`, `shield`, `water`, `moon`, `flash`, `skull`, `planet`, etc.).
  - Editable al crear el mazo o en cualquier momento desde el menú de opciones.
- **Cálculo de Costo del Mazo**: Estimación en USD del valor total del mazo basado en precios de mercado.

---

### 4. Cruce con Colección Física ("¿Puedo armarlo en físico?")
- **Detección Automática de Posesión**: La aplicación compara cada carta del mazo contra tu colección registrada para avisarte si tienes las cartas necesarias para jugar en la vida real.
- **Insignias Visuales por Carta**:
  - `✓ En físico` cuando tienes suficientes copias.
  - `⚠️ X/Y` cuando te faltan copias para completar el mazo.
- **Porcentaje de Completitud en la Lista**: Cada mazo muestra su porcentaje de preparación física (ej. `85% físico` o `100% físico`).
- **Modal de Diagnóstico y Presupuesto Faltante**:
  - Barra de progreso interactiva.
  - Monto exacto en USD necesario para comprar las cartas que te faltan.
  - Desglose carta por carta de las faltantes con un botón de **"+1"** para registrarlas en tu colección en cuanto las compres o consigas.

---

### 5. Seguimiento de Partidas y Winrate (Match Tracker)
- **Pestaña de Partidas por Mazo**: Historial de enfrentamientos exclusivo vinculado a cada mazo creado.
- **Tarjeta de Winrate Hero**:
  - Porcentaje de victorias en tiempo real (`% WINRATE`).
  - Conteo de Victorias (`V`), Derrotas (`D`) y Empates (`E`).
- **Registro Rápido de Partidas**:
  - Selección de resultado (*Victoria / Derrota / Empate*).
  - Marcador oficial por puntos (regla de los 8 puntos de Riftbound).
  - Registro de nombre del rival y campeón/arquetipo contrario (ej. *"Zed Shadow Aggro"*).
  - Campo de notas estratégicas y fecha de la partida.
- **Gestión de Historial**: Permite consultar detalles pasados o eliminar registros erróneos.

---

### 6. Sistema de Importación, Exportación y Duplicación
- **Exportación Flexible en 2 Formatos**:
  - **Código RIFT1 (Portabilidad 100% exacta)**: Cadena Base64 que encapsula IDs, cantidades, leyenda, runas, banquillo, color e icono para respaldos o transferencias exactas.
  - **Lista de Texto Estándar (Social & Torneos)**: Formato universal legible para Discord, foros, WhatsApp y organizadores de torneos (con etiquetas `[Leyenda]`, `[Unidades]`, `[Hechizos]`, etc.).
  - **Botón de Compartir y Copiar al Portapapeles**: Copia con 1 toque o abre el diálogo nativo de compartir en iOS y Android.
- **Importador Inteligente**:
  - Detecta automáticamente si pegas un código `RIFT1-`, un JSON o una lista de texto plano.
  - Genera una vista previa instantánea (Leyenda, icono, color y conteo de cartas) antes de confirmar la importación.
- **Duplicar Mazo en 1 Clic (Crear Variante)**:
  - Clona la estructura completa del mazo bajo el nombre `"${nombre} (Variante)"` para experimentar con cartas nuevas sin alterar tu mazo competitivo original.

---

### 7. Herramientas de Juego: Contador y Calculadora de Intercambios
- **Contador de Partida en Vivo (`MatchScreen`)**:
  - Soporte multijugador para **1, 2, 3 o 4 jugadores** simultáneos en una sola pantalla.
  - Ajuste de puntos de victoria oficiales (por defecto: meta de **8 puntos**).
  - Contador de experiencia (**XP**) opcional por jugador.
  - Personalización de nombres, colores y retratos de campeones de League of Legends / Riftbound.
- **Calculadora de Intercambios Justos (`TradeScreen`)**:
  - Interfaz de doble columna: **Tú ofreces** vs. **Tu rival ofrece**.
  - Búsqueda en vivo de cartas en el catálogo con sus precios actuales.
  - Comparativa de valores totales en USD.
  - Indicador de balance porcentual (*Fair Trade Gauge*) y cálculo de la diferencia monetaria exacta para evitar negociaciones injustas.

---

### 8. Autenticación Híbrida y Perfil de Invocador
- **Supabase Authentication**: Inicio de sesión seguro con correo electrónico y contraseña.
- **Modo Invitado (*Guest Mode*)**: Acceso completo a todas las herramientas de la aplicación sin necesidad de registrarse.
- **Perfil de Invocador**: Estadísticas consolidadas de coleccionista, fecha de registro y edición de avatar y apodo.

---

## 📜 Reglamento Oficial Riftbound Integrado

El Deck Builder incluye los requisitos del reglamento oficial:

| Requisito | Cantidad Oficial | Estado en Rift Dex |
| :--- | :---: | :--- |
| **Leyenda** | Exactamente 1 | Validado (1/1) |
| **Campos de Batalla** | Exactamente 3 | Validado (3/3) |
| **Runas** | Exactamente 12 | Validado (12/12) |
| **Mazo Principal** | Exactamente 40 cartas | Validado (Unidades + Hechizos + Gear) |
| **Máximo de copias** | Máximo 3 por carta | Alerta visual en cartas con > 3 copias |
| **Banquillo (*Sideboard*)** | Máximo 10 cartas | Validado (0 - 10) |
| **Puntuación de Partida** | Meta de 8 puntos | Integrado en el contador y match tracker |

---

## 🛠️ Tecnologías Utilizadas

- **Framework**: [React Native](https://reactnative.dev/) (v0.88.1)
- **Plataforma y Tooling**: [Expo](https://expo.dev/) (SDK 58)
- **Navegación**: [Expo Router](https://docs.expo.dev/router/introduction/) (v58.0.32) con tipado estricto
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/) (v6.0.3)
- **Backend & Autenticación**: [Supabase](https://supabase.com/) (`@supabase/supabase-js` v2.119)
- **Almacenamiento Local Offline**: [`@react-native-async-storage/async-storage`](https://github.com/react-native-async-storage/async-storage)
- **Iconografía**: [`@expo/vector-icons`](https://docs.expo.dev/guides/icons/) (Ionicons)
- **Manejo de Imágenes**: [`expo-image`](https://docs.expo.dev/versions/latest/sdk/image/)
- **Animaciones**: [`react-native-reanimated`](https://docs.swmansion.com/react-native-reanimated/) (v4.7.1)
- **Gestor de Paquetes**: [pnpm](https://pnpm.io/) (v12.15+)

---

## 📁 Estructura del Proyecto

```text
rift-dex/
├── assets/                  # Iconos, imágenes y recursos estáticos
├── scripts/                 # Utilidades de mantenimiento y reset
├── src/
│   ├── app/                 # Rutas de Expo Router (_layout, index, explore)
│   ├── components/          # Componentes modulares reutilizables
│   │   ├── cards/           # CardItem, CardDetailModal, FilterChips, SearchBar
│   │   ├── collection/      # CreateFolderModal, FolderSelector, VaultStatsHeader
│   │   ├── decks/           # DeckListItem, DeckDetailView, CreateDeckModal,
│   │   │                    # EditDeckModal, ImportDeckModal, ExportDeckModal,
│   │   │                    # DeckCollectionAnalysisModal, RecordMatchModal
│   │   ├── navigation/      # BottomTabBar personalizada
│   │   └── profile/         # EditProfileModal
│   ├── constants/           # Paletas de color, temas TCG e internacionalización
│   ├── context/             # React Contexts (Auth, Collection, Deck, Language, Profile)
│   ├── screens/             # Pantallas principales (Cards, Collection, Decks, Tools, Match, Trade, Login, Profile)
│   ├── services/            # Repositorios (openRiftApi, supabaseClient, deckRepository, matchRepository, collectionRepository)
│   ├── types/               # Definiciones de TypeScript (card, deck, collection, match)
│   └── utils/               # Utilidades (deckValidation, deckExportImport, deckCollectionAnalysis)
├── .env.example             # Plantilla de variables de entorno
├── app.json                 # Configuración universal de Expo
├── package.json             # Dependencias y scripts
├── pnpm-workspace.yaml      # Configuración de workspace pnpm
└── tsconfig.json            # Configuración de compilador TypeScript
```

---

## 💻 Instalación y Configuración

### Prerrequisitos
- [Node.js](https://nodejs.org/) (versión 20 o superior recomendada).
- [pnpm](https://pnpm.io/) instalado globalmente (`npm install -g pnpm`).
- [Expo Go](https://expo.dev/go) en tu dispositivo móvil (Android o iOS) para pruebas rápidas.

### Pasos de Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone <url-del-repositorio>
   cd rift-dex/rift-dex
   ```

2. **Instalar dependencias con pnpm**:
   ```bash
   pnpm install
   ```

3. **Configurar las variables de entorno**:
   Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
   Rellena las claves de tu proyecto de Supabase (o déjalas vacías para utilizar el modo offline / invitado).

4. **Verificar la salud del proyecto**:
   ```bash
   pnpm dlx expo-doctor
   ```

5. **Iniciar el servidor de desarrollo**:
   ```bash
   pnpm run dev
   ```

6. **Abrir la aplicación**:
   - **Móvil**: Escanea el código QR desde la app **Expo Go** (Android) o la cámara (iOS).
   - **Web**: Presiona `w` en la consola o abre `http://localhost:8081`.
   - **Android**: Presiona `a` para abrir en el emulador de Android.
   - **iOS**: Presiona `i` para abrir en el simulador de iOS (macOS).

---

## 🔐 Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con la siguiente estructura:

```env
# URL de tu instancia de Supabase
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co

# Clave pública anónima de Supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

> **Nota:** La aplicación cuenta con detección de configuración automática. Si no configuras Supabase, Rift Dex funcionará en modo **Offline / Invitado**, almacenando tus datos localmente en tu dispositivo mediante `AsyncStorage`.

---

## ⚡ Scripts Disponibles

En el directorio del proyecto puedes ejecutar:

| Comando | Descripción |
| :--- | :--- |
| `pnpm run dev` / `pnpm start` | Inicia el bundler Metro de Expo para desarrollo |
| `pnpm exec tsc --noEmit` | Ejecuta la verificación estricta de tipos de TypeScript |
| `pnpm dlx expo-doctor` | Diagnostica dependencias, configuración y compatibilidad de SDK |
| `pnpm run android` | Inicia Metro y lanza la aplicación en Android |
| `pnpm run ios` | Inicia Metro y lanza la aplicación en iOS |
| `pnpm run web` | Inicia la versión Web en el navegador |
| `pnpm run lint` | Ejecuta el linter del proyecto |

---

<p align="center">
  Desarrollado con pasión para la comunidad de <b>Riftbound TCG</b> ⚔️✨
</p>
