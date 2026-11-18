import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseConfigured } from '@/services/supabaseClient';

export const LoginScreen: React.FC = () => {
  const { signIn, signUp, continueAsGuest } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        const res = await signIn(email, password);
        if (!res.success) {
          setErrorMessage(res.error || 'Error al iniciar sesión.');
        }
      } else {
        const res = await signUp(email, password, username);
        if (!res.success) {
          setErrorMessage(res.error || 'Error al crear la cuenta.');
        } else if (res.message) {
          setSuccessMessage(res.message);
          setMode('signin');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isConnected = isSupabaseConfigured();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Logo / Encabezado */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Ionicons name="sparkles" size={32} color="#60A5FA" />
          </View>
          <Text style={styles.brandTitle}>
            RIFT<Text style={styles.brandTitleAccent}>VAULT</Text>
          </Text>
          <Text style={styles.brandSubtitle}>
            Compañero TCG de Riftbound & League of Legends
          </Text>

          {/* Estado de Supabase */}
          <View style={[styles.backendStatusBadge, isConnected ? styles.statusConnected : styles.statusLocal]}>
            <Ionicons
              name={isConnected ? 'cloud-done-outline' : 'laptop-outline'}
              size={13}
              color={isConnected ? '#34D399' : '#94A3B8'}
              style={{ marginRight: 5 }}
            />
            <Text style={[styles.backendStatusText, isConnected ? styles.textConnected : styles.textLocal]}>
              {isConnected ? 'Supabase Conectado' : 'Modo Local (Configura .env)'}
            </Text>
          </View>
        </View>

        {/* Tarjeta de Formulario */}
        <View style={styles.card}>
          {/* Selector de modo: Iniciar Sesión / Registro */}
          <View style={styles.tabToggle}>
            <TouchableOpacity
              style={[styles.tabBtn, mode === 'signin' && styles.tabBtnActive]}
              onPress={() => {
                setMode('signin');
                setErrorMessage(null);
              }}
            >
              <Text style={[styles.tabBtnText, mode === 'signin' && styles.tabBtnTextActive]}>
                Iniciar Sesión
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, mode === 'signup' && styles.tabBtnActive]}
              onPress={() => {
                setMode('signup');
                setErrorMessage(null);
              }}
            >
              <Text style={[styles.tabBtnText, mode === 'signup' && styles.tabBtnTextActive]}>
                Crear Cuenta
              </Text>
            </TouchableOpacity>
          </View>

          {/* Banner de éxito */}
          {successMessage && (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginRight: 6 }} />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          {/* Banner de error */}
          {errorMessage && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Campo Nombre de Invocador (solo en Sign Up) */}
          {mode === 'signup' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre de Invocador</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ej. ZedMaster_99"
                  placeholderTextColor="#64748B"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            </View>
          )}

          {/* Campo Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="tu_email@ejemplo.com"
                placeholderTextColor="#64748B"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Campo Contraseña */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#64748B"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Botón Principal */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {mode === 'signin' ? 'Entrar al Nexo' : 'Comenzar Aventura'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Botón Invitado / Modo Prueba */}
          <TouchableOpacity
            style={styles.guestBtn}
            onPress={continueAsGuest}
            activeOpacity={0.8}
          >
            <Ionicons name="play-outline" size={18} color="#94A3B8" style={{ marginRight: 6 }} />
            <Text style={styles.guestBtnText}>Continuar como invitado</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D14',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2563EB',
    marginBottom: 14,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 2,
  },
  brandTitleAccent: {
    color: '#3B82F6',
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#8E9AA8',
    marginTop: 4,
    textAlign: 'center',
  },
  backendStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
  },
  statusConnected: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusLocal: {
    backgroundColor: '#161F30',
    borderColor: '#26334D',
  },
  backendStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  textConnected: {
    color: '#34D399',
  },
  textLocal: {
    color: '#94A3B8',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#0F1522',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: '#161F30',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#2563EB',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E9AA8',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  successText: {
    fontSize: 12,
    color: '#34D399',
    flex: 1,
    lineHeight: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161F30',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26334D',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
  },
  eyeBtn: {
    padding: 6,
  },
  primaryBtn: {
    backgroundColor: '#1D4ED8',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1E293B',
  },
  dividerText: {
    color: '#64748B',
    marginHorizontal: 12,
    fontSize: 12,
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#26334D',
    backgroundColor: '#161F30',
  },
  guestBtnText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
  },
});
