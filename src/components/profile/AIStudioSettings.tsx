import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useTheme } from '@/context/ThemeContext';
import { useAI } from '@/context/AIContext';
import { AIModelItem } from '@/types/ai';

interface AIStudioSettingsProps {
  onOpenOracleChat?: () => void;
}

export const AIStudioSettings: React.FC<AIStudioSettingsProps> = ({ onOpenOracleChat }) => {
  const { theme } = useTheme();
  const {
    apiKey,
    isConfigured,
    isValidating,
    activeModel,
    activeModelItem,
    modelsTable,
    visibleModels,
    contextConfig,
    saveApiKey,
    removeApiKey,
    changeModel,
    toggleModelActive,
    toggleModelVisible,
    setDefaultModel,
    addCustomModel,
    deleteCustomModel,
    resetModelsToDefault,
    updateContextConfig,
    getPreviewContext,
  } = useAI();

  const [inputKey, setInputKey] = useState(apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isManageCatalogOpen, setIsManageCatalogOpen] = useState(false);
  const [isAddModelModalVisible, setIsAddModelModalVisible] = useState(false);

  // Formulario nuevo modelo
  const [newModelName, setNewModelName] = useState('');
  const [newModelUrl, setNewModelUrl] = useState('');
  const [newModelDesc, setNewModelDesc] = useState('');
  const [newModelIsActive, setNewModelIsActive] = useState(true);
  const [newModelIsVisible, setNewModelIsVisible] = useState(true);

  const [customInstructions, setCustomInstructions] = useState(
    contextConfig.customInstructions || ''
  );

  const handleSaveKey = async () => {
    if (!inputKey.trim()) {
      Alert.alert('Clave Vacía', 'Por favor ingresa una API Key de Google AI Studio.');
      return;
    }

    const result = await saveApiKey(inputKey.trim());
    if (result.isValid) {
      Alert.alert(
        '¡Conexión Exitosa! ⚡',
        `Google AI Studio ha validado tu clave correctamente con ${result.modelUsed || activeModelItem.name}. ¡El Oráculo del Nexo está listo para aconsejarte!`
      );
    } else {
      Alert.alert(
        'Validación Fallida',
        result.error || 'La clave proporcionada no es válida o fue rechazada por Google.'
      );
    }
  };

  const handleRemoveKey = () => {
    Alert.alert(
      'Desvincular API Key',
      '¿Deseas eliminar tu clave de Google AI Studio de este dispositivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await removeApiKey();
            setInputKey('');
            Alert.alert('Clave eliminada', 'Tu API Key ha sido retirada del dispositivo.');
          },
        },
      ]
    );
  };

  const handleOpenStudioLink = () => {
    Linking.openURL('https://aistudio.google.com/apikey');
  };

  const handleSaveInstructions = () => {
    updateContextConfig({ customInstructions });
    Alert.alert('Guardado', 'Instrucciones personalizadas actualizadas.');
  };

  const handleAddNewModel = async () => {
    if (!newModelName.trim() || !newModelUrl.trim()) {
      Alert.alert('Campos Incompletos', 'Por favor ingresa al menos el nombre y la URL del modelo.');
      return;
    }

    await addCustomModel({
      name: newModelName.trim(),
      endpointUrl: newModelUrl.trim(),
      description: newModelDesc.trim() || undefined,
      isActive: newModelIsActive,
      isVisible: newModelIsVisible,
    });

    setNewModelName('');
    setNewModelUrl('');
    setNewModelDesc('');
    setNewModelIsActive(true);
    setNewModelIsVisible(true);
    setIsAddModelModalVisible(false);
    Alert.alert('Modelo Agregado', `El modelo "${newModelName.trim()}" ha sido registrado en el catálogo.`);
  };

  const handleConfirmReset = () => {
    Alert.alert(
      'Restaurar Modelos',
      '¿Deseas restablecer el catálogo de modelos a los valores originales (Gemini 3.5 Flash Lite como único activo y visible)?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: async () => {
            await resetModelsToDefault();
            Alert.alert('Restablecido', 'Catálogo de modelos restaurado.');
          },
        },
      ]
    );
  };

  // Modelos que se muestran al usuario común: solo los que son visibles y activos
  const displayedModelsForUser = visibleModels.filter(m => m.isActive);

  return (
    <View style={styles.container}>
      {/* Tarjeta de Estado de Conexión */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: isConfigured ? '#10B981' : theme.cardBorder,
          },
        ]}
      >
        <View style={styles.statusHeaderRow}>
          <View style={styles.statusTitleRow}>
            <View
              style={[
                styles.statusIconCircle,
                { backgroundColor: isConfigured ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)' },
              ]}
            >
              <Ionicons
                name={isConfigured ? 'sparkles' : 'key-outline'}
                size={22}
                color={isConfigured ? '#10B981' : '#F59E0B'}
              />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                Google AI Studio (Gemini)
              </Text>
              <Text style={[styles.cardSubtitle, { color: isConfigured ? '#10B981' : theme.textMuted }]}>
                {isConfigured ? `✓ En uso: ${activeModelItem.name}` : 'No configurado'}
              </Text>
            </View>
          </View>

          {isConfigured && onOpenOracleChat && (
            <TouchableOpacity
              style={[styles.oracleLaunchBtn, { backgroundColor: theme.primary }]}
              onPress={onOpenOracleChat}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubbles" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.oracleLaunchText}>Abrir Chat</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
          Integra tu API Key personal de Google AI Studio. Cada invocador utiliza su cuota
          propia sin limitaciones compartidas, recibiendo análisis de mazos, sinergias y estrategia en tiempo real.
        </Text>

        {/* Input de API Key */}
        <View style={styles.inputWrapper}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
            API Token de Google AI Studio
          </Text>
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.cardHighlight,
                borderColor: theme.cardBorder,
              },
            ]}
          >
            <Ionicons name="key" size={18} color={theme.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.textInput, { color: theme.textPrimary }]}
              placeholder="Pega aquí tu clave (ej. AIzaSy...)"
              placeholderTextColor={theme.textMuted}
              value={inputKey}
              onChangeText={setInputKey}
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowKey(!showKey)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showKey ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={theme.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Botones de Acción para la Key */}
        <View style={styles.actionBtnRow}>
          <TouchableOpacity
            style={[
              styles.validateBtn,
              { backgroundColor: theme.primary },
              isValidating && { opacity: 0.7 },
            ]}
            onPress={handleSaveKey}
            disabled={isValidating}
            activeOpacity={0.8}
          >
            {isValidating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.btnTextWhite}>Validar y Conectar</Text>
              </>
            )}
          </TouchableOpacity>

          {isConfigured && (
            <TouchableOpacity
              style={[styles.deleteBtn, { borderColor: theme.danger + '40' }]}
              onPress={handleRemoveKey}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color={theme.danger} />
            </TouchableOpacity>
          )}
        </View>

        {/* Enlace para obtener clave gratis */}
        <TouchableOpacity
          style={styles.linkHelpRow}
          onPress={handleOpenStudioLink}
          activeOpacity={0.7}
        >
          <Ionicons name="open-outline" size={15} color={theme.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.linkHelpText, { color: theme.primary }]}>
            ¿No tienes una clave? Consíguela gratis en Google AI Studio
          </Text>
        </TouchableOpacity>
      </View>

      {/* SECCIÓN 1: MODELOS DISPONIBLES (SOLO VISIBLES Y ACTIVOS) */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.tableHeaderRow}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="sparkles" size={18} color={theme.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
                Modelo en Uso
              </Text>
            </View>
            <Text style={[styles.sectionSubheading, { color: theme.textMuted }]}>
              {displayedModelsForUser.length === 1
                ? 'Modelo activo configurado por defecto para procesar tus preguntas:'
                : 'Selecciona cuál de los modelos activos procesará tus consultas:'}
            </Text>
          </View>

          {/* Botón para alternar la vista de administración completa */}
          <TouchableOpacity
            style={[
              styles.manageToggleBtn,
              {
                backgroundColor: isManageCatalogOpen ? theme.primary : theme.cardHighlight,
                borderColor: isManageCatalogOpen ? theme.primary : theme.cardBorder,
              },
            ]}
            onPress={() => setIsManageCatalogOpen(!isManageCatalogOpen)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isManageCatalogOpen ? 'close-circle-outline' : 'options-outline'}
              size={15}
              color={isManageCatalogOpen ? '#FFFFFF' : theme.textPrimary}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.manageToggleBtnText,
                { color: isManageCatalogOpen ? '#FFFFFF' : theme.textPrimary },
              ]}
            >
              {isManageCatalogOpen ? 'Cerrar Gestor' : 'Gestionar Catálogo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Modelos que SÍ se muestran (visibles y activos) */}
        <View style={styles.modelList}>
          {displayedModelsForUser.map(model => {
            const isCurrentSelected = activeModelItem.id === model.id;
            return (
              <TouchableOpacity
                key={model.id}
                style={[
                  styles.modelTableRow,
                  {
                    backgroundColor: isCurrentSelected ? theme.primary + '15' : theme.cardHighlight,
                    borderColor: isCurrentSelected ? theme.primary : theme.cardBorder,
                  },
                ]}
                onPress={() => changeModel(model.id)}
                activeOpacity={0.8}
              >
                <View style={styles.modelTopRow}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                      <Text
                        style={[
                          styles.modelNameText,
                          { color: isCurrentSelected ? theme.primary : theme.textPrimary },
                        ]}
                      >
                        {model.name}
                      </Text>
                      {model.isDefault && (
                        <View style={[styles.badgePill, { backgroundColor: '#10B98125', borderColor: '#10B981' }]}>
                          <Text style={[styles.badgeText, { color: '#10B981' }]}>POR DEFECTO</Text>
                        </View>
                      )}
                      <View style={[styles.badgePill, { backgroundColor: '#3B82F625', borderColor: '#3B82F6' }]}>
                        <Text style={[styles.badgeText, { color: '#3B82F6' }]}>ACTIVO</Text>
                      </View>
                    </View>

                    {model.description && (
                      <Text style={[styles.modelDescription, { color: theme.textMuted, marginTop: 4 }]}>
                        {model.description}
                      </Text>
                    )}
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      { borderColor: isCurrentSelected ? theme.primary : theme.cardBorder },
                    ]}
                  >
                    {isCurrentSelected && <View style={[styles.radioDot, { backgroundColor: theme.primary }]} />}
                  </View>
                </View>

                {/* URL del Llamado */}
                <View style={[styles.endpointContainer, { backgroundColor: theme.background, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.endpointLabel, { color: theme.textMuted }]}>URL de Llamado:</Text>
                  <Text style={[styles.endpointUrlText, { color: theme.textSecondary }]} numberOfLines={2} selectable>
                    {model.endpointUrl}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {displayedModelsForUser.length === 0 && (
          <View style={styles.emptyNoticeBox}>
            <Ionicons name="alert-circle-outline" size={24} color="#F59E0B" style={{ marginBottom: 6 }} />
            <Text style={[styles.emptyNoticeTitle, { color: theme.textPrimary }]}>
              No hay modelos activos visibles
            </Text>
            <Text style={[styles.emptyNoticeDesc, { color: theme.textMuted }]}>
              Abre el "Gestor de Catálogo" para activar o hacer visible al menos un modelo.
            </Text>
          </View>
        )}
      </View>

      {/* SECCIÓN 2: GESTOR DE CATÁLOGO COMPLETO (VISIBILIDAD, ACTIVACIÓN Y NUEVOS MODELOS) */}
      {isManageCatalogOpen && (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.primary }]}>
          <View style={styles.tableHeaderRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="construct-outline" size={18} color={theme.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
                  Gestión del Catálogo de Modelos
                </Text>
              </View>
              <Text style={[styles.sectionSubheading, { color: theme.textMuted }]}>
                Controla qué modelos están visibles para los invocadores, cuáles están activos para llamadas y define el modelo por defecto:
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.addModelBtn, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
              onPress={() => setIsAddModelModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={16} color={theme.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.addModelBtnText, { color: theme.primary }]}>+ Agregar</Text>
            </TouchableOpacity>
          </View>

          {/* Tabla con TODOS los modelos */}
          <View style={styles.modelList}>
            {modelsTable.map(model => {
              const isCurrentSelected = activeModelItem.id === model.id;
              return (
                <View
                  key={model.id}
                  style={[
                    styles.modelTableRow,
                    {
                      backgroundColor: theme.cardHighlight,
                      borderColor: model.isDefault ? '#10B981' : theme.cardBorder,
                      opacity: model.isVisible ? 1 : 0.6,
                    },
                  ]}
                >
                  {/* Encabezado del modelo en la tabla */}
                  <View style={styles.modelTopRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                        <Text style={[styles.modelNameText, { color: theme.textPrimary }]}>
                          {model.name}
                        </Text>
                        {model.isDefault && (
                          <View style={[styles.badgePill, { backgroundColor: '#10B98125', borderColor: '#10B981' }]}>
                            <Text style={[styles.badgeText, { color: '#10B981' }]}>POR DEFECTO</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.endpointUrlSmall, { color: theme.textMuted }]} numberOfLines={1}>
                        {model.endpointUrl}
                      </Text>
                    </View>

                    {/* Controles de Visibilidad y Activación */}
                    <View style={styles.switchesGroupRow}>
                      {/* Switch isVisible */}
                      <View style={styles.miniSwitchCol}>
                        <Text style={[styles.miniSwitchLabel, { color: model.isVisible ? '#10B981' : '#6B7280' }]}>
                          {model.isVisible ? 'Visible' : 'Oculto'}
                        </Text>
                        <Switch
                          value={model.isVisible}
                          onValueChange={val => toggleModelVisible(model.id, val)}
                          trackColor={{ false: '#374151', true: '#10B981' }}
                        />
                      </View>

                      {/* Switch isActive */}
                      <View style={styles.miniSwitchCol}>
                        <Text style={[styles.miniSwitchLabel, { color: model.isActive ? theme.primary : '#6B7280' }]}>
                          {model.isActive ? 'Activo' : 'Inactivo'}
                        </Text>
                        <Switch
                          value={model.isActive}
                          onValueChange={val => toggleModelActive(model.id, val)}
                          trackColor={{ false: '#374151', true: theme.primary }}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Fila de Acciones: Establecer por Defecto y Eliminar */}
                  <View style={styles.manageRowActions}>
                    {!model.isDefault ? (
                      <TouchableOpacity
                        style={[styles.setDefaultBtn, { borderColor: theme.cardBorder }]}
                        onPress={() => setDefaultModel(model.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="star-outline" size={13} color={theme.textSecondary} style={{ marginRight: 4 }} />
                        <Text style={[styles.setDefaultBtnText, { color: theme.textSecondary }]}>
                          Hacer Por Defecto
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.isDefaultIndicator}>
                        <Ionicons name="star" size={13} color="#10B981" style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '700' }}>
                          Predeterminado del Sistema
                        </Text>
                      </View>
                    )}

                    {model.id.startsWith('custom-') && (
                      <TouchableOpacity
                        style={[styles.deleteCustomBtn, { borderColor: theme.danger + '40' }]}
                        onPress={() => deleteCustomModel(model.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={14} color={theme.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Botón para restablecer el catálogo a valores de fábrica */}
          <TouchableOpacity
            style={[styles.resetTableBtn, { borderColor: theme.cardBorder }]}
            onPress={handleConfirmReset}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={14} color={theme.textMuted} style={{ marginRight: 6 }} />
            <Text style={[styles.resetTableBtnText, { color: theme.textMuted }]}>
              Restablecer catálogo a valores de fábrica
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Configuración del Contexto Automático Enviado por Debajo */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.contextHeaderRow}>
          <View>
            <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
              Contexto Enviado por Debajo
            </Text>
            <Text style={[styles.sectionSubheading, { color: theme.textMuted }]}>
              Elige qué datos de tu partida y cuenta alimentan al Oráculo:
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.previewContextBtn, { borderColor: theme.cardBorder, backgroundColor: theme.cardHighlight }]}
            onPress={() => setIsPreviewVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="eye-outline" size={14} color={theme.textPrimary} style={{ marginRight: 4 }} />
            <Text style={[styles.previewContextBtnText, { color: theme.textPrimary }]}>
              Ver Contexto
            </Text>
          </TouchableOpacity>
        </View>

        {/* Toggle: Perfil */}
        <View style={[styles.toggleRow, { borderBottomColor: theme.cardBorder }]}>
          <View style={styles.toggleInfo}>
            <Text style={[styles.toggleTitle, { color: theme.textPrimary }]}>
              Datos de Invocador y Rango
            </Text>
            <Text style={[styles.toggleDesc, { color: theme.textMuted }]}>
              Envía tu nombre de invocador, victorias y nivel competitivo.
            </Text>
          </View>
          <Switch
            value={contextConfig.includeProfile}
            onValueChange={v => updateContextConfig({ includeProfile: v })}
            trackColor={{ false: '#374151', true: theme.primary }}
          />
        </View>

        {/* Toggle: Mazos */}
        <View style={[styles.toggleRow, { borderBottomColor: theme.cardBorder }]}>
          <View style={styles.toggleInfo}>
            <Text style={[styles.toggleTitle, { color: theme.textPrimary }]}>
              Mazos Creados
            </Text>
            <Text style={[styles.toggleDesc, { color: theme.textMuted }]}>
              Envía la lista de tus mazos guardados para pedir consejos comparativos.
            </Text>
          </View>
          <Switch
            value={contextConfig.includeDecks}
            onValueChange={v => updateContextConfig({ includeDecks: v })}
            trackColor={{ false: '#374151', true: theme.primary }}
          />
        </View>

        {/* Toggle: Colección */}
        <View style={[styles.toggleRow, { borderBottomColor: theme.cardBorder }]}>
          <View style={styles.toggleInfo}>
            <Text style={[styles.toggleTitle, { color: theme.textPrimary }]}>
              Resumen de Colección
            </Text>
            <Text style={[styles.toggleDesc, { color: theme.textMuted }]}>
              Permite a la IA recomendarte cartas que realmente tienes en tu inventario.
            </Text>
          </View>
          <Switch
            value={contextConfig.includeCollection}
            onValueChange={v => updateContextConfig({ includeCollection: v })}
            trackColor={{ false: '#374151', true: theme.primary }}
          />
        </View>

        {/* Toggle: Reglas del Juego */}
        <View style={[styles.toggleRow, { borderBottomColor: theme.cardBorder }]}>
          <View style={styles.toggleInfo}>
            <Text style={[styles.toggleTitle, { color: theme.textPrimary }]}>
              Reglas Oficiales de Riftbound
            </Text>
            <Text style={[styles.toggleDesc, { color: theme.textMuted }]}>
              Estructura de 1 Leyenda, 12 Runas, 3 Battlefields y dominios mágicos.
            </Text>
          </View>
          <Switch
            value={contextConfig.includeGameRules}
            onValueChange={v => updateContextConfig({ includeGameRules: v })}
            trackColor={{ false: '#374151', true: theme.primary }}
          />
        </View>

        {/* Contexto e Instrucciones Personalizadas */}
        <View style={styles.customInstBox}>
          <Text style={[styles.toggleTitle, { color: theme.textPrimary, marginBottom: 4 }]}>
            Instrucciones o Contexto Extra para la IA
          </Text>
          <Text style={[styles.toggleDesc, { color: theme.textMuted, marginBottom: 10 }]}>
            Agrega detalles específicos de tu estilo de juego:
          </Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: theme.cardHighlight,
                borderColor: theme.cardBorder,
                color: theme.textPrimary,
              },
            ]}
            placeholder="Escribe aquí cualquier contexto adicional..."
            placeholderTextColor={theme.textMuted}
            value={customInstructions}
            onChangeText={setCustomInstructions}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={[styles.saveCustomBtn, { backgroundColor: theme.cardHighlight, borderColor: theme.cardBorder }]}
            onPress={handleSaveInstructions}
            activeOpacity={0.7}
          >
            <Ionicons name="save-outline" size={14} color={theme.textPrimary} style={{ marginRight: 6 }} />
            <Text style={[styles.saveCustomBtnText, { color: theme.textPrimary }]}>
              Guardar Instrucciones Personalizadas
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal para Agregar Nuevo Modelo */}
      <Modal
        visible={isAddModelModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddModelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="add-circle-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  Agregar Nuevo Modelo
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsAddModelModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
              Configura un modelo nuevo ingresando su nombre y URL directa de llamada:
            </Text>

            <View style={{ gap: 12, marginVertical: 14 }}>
              <View>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Nombre del Modelo</Text>
                <TextInput
                  style={[styles.textInputFull, { backgroundColor: theme.cardHighlight, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                  placeholder="ej. Gemini 3.5 Flash Lite"
                  placeholderTextColor={theme.textMuted}
                  value={newModelName}
                  onChangeText={setNewModelName}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>URL de Llamado (Endpoint)</Text>
                <TextInput
                  style={[styles.textInputFull, { backgroundColor: theme.cardHighlight, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                  placeholder="https://generativelanguage.googleapis.com/v1beta/models/...:generateContent"
                  placeholderTextColor={theme.textMuted}
                  value={newModelUrl}
                  onChangeText={setNewModelUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Descripción (Opcional)</Text>
                <TextInput
                  style={[styles.textInputFull, { backgroundColor: theme.cardHighlight, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                  placeholder="ej. Modelo ultra rápido y ligero"
                  placeholderTextColor={theme.textMuted}
                  value={newModelDesc}
                  onChangeText={setNewModelDesc}
                />
              </View>

              {/* Toggles iniciales: Visible y Activo */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary, marginBottom: 0, marginRight: 8 }]}>
                    Visible en lista:
                  </Text>
                  <Switch
                    value={newModelIsVisible}
                    onValueChange={setNewModelIsVisible}
                    trackColor={{ false: '#374151', true: '#10B981' }}
                  />
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary, marginBottom: 0, marginRight: 8 }]}>
                    Activo:
                  </Text>
                  <Switch
                    value={newModelIsActive}
                    onValueChange={setNewModelIsActive}
                    trackColor={{ false: '#374151', true: theme.primary }}
                  />
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <TouchableOpacity
                style={[styles.modalSecondaryBtn, { borderColor: theme.cardBorder }]}
                onPress={() => setIsAddModelModalVisible(false)}
              >
                <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalPrimaryBtn, { backgroundColor: theme.primary }]}
                onPress={handleAddNewModel}
              >
                <Text style={styles.btnTextWhite}>Guardar Modelo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Previsualización de Contexto */}
      <Modal
        visible={isPreviewVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPreviewVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="code-slash" size={20} color={theme.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  Contexto Enviado al Modelo
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsPreviewVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
              Este es el texto exacto que se inyecta como instrucción de sistema (System Prompt) a Google AI Studio:
            </Text>

            <ScrollView style={[styles.previewScroll, { backgroundColor: theme.cardHighlight }]}>
              <Text style={[styles.previewCodeText, { color: theme.textSecondary }]}>
                {getPreviewContext()}
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={[styles.closeModalFullBtn, { backgroundColor: theme.primary }]}
              onPress={() => setIsPreviewVisible(false)}
            >
              <Text style={styles.btnTextWhite}>Cerrar Vista Previa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  oracleLaunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  oracleLaunchText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  inputWrapper: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 46,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  textInputFull: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  eyeBtn: {
    padding: 4,
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  validateBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnTextWhite: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  linkHelpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  linkHelpText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionSubheading: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  manageToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  manageToggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  addModelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addModelBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modelList: {
    gap: 12,
  },
  modelTableRow: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  modelTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  modelNameText: {
    fontSize: 15,
    fontWeight: '700',
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modelDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  endpointContainer: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    marginTop: 8,
  },
  endpointLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  endpointUrlText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  endpointUrlSmall: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  switchesGroupRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  miniSwitchCol: {
    alignItems: 'center',
  },
  miniSwitchLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  manageRowActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  setDefaultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  setDefaultBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  isDefaultIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteCustomBtn: {
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetTableBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 14,
  },
  resetTableBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyNoticeBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F59E0B40',
    backgroundColor: '#F59E0B10',
  },
  emptyNoticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  emptyNoticeDesc: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  contextHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewContextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  previewContextBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  customInstBox: {
    marginTop: 14,
  },
  textArea: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  saveCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
  },
  saveCustomBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  modalCloseBtn: {
    padding: 4,
  },
  previewScroll: {
    borderRadius: 10,
    padding: 12,
    maxHeight: 340,
    marginBottom: 16,
  },
  previewCodeText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
  closeModalFullBtn: {
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSecondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPrimaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
