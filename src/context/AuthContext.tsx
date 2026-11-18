import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';

export interface AppUser {
  id: string;
  email?: string;
  username: string;
  isGuest?: boolean;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<AuthResponse>;
  signUp: (email: string, pass: string, username: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Mapeo amigable de errores de Supabase Auth
  const translateAuthError = (err: string): string => {
    const lower = err.toLowerCase();
    if (lower.includes('invalid login credentials')) {
      return 'Credenciales incorrectas. Verifica tu correo y contraseña.';
    }
    if (lower.includes('email not confirmed')) {
      return 'Tu correo no ha sido confirmado. Revisa tu bandeja de entrada o confirma el usuario en la consola de Supabase.';
    }
    if (lower.includes('user already registered')) {
      return 'Este correo ya está registrado. Por favor inicia sesión.';
    }
    if (lower.includes('password should be at least 6 characters')) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (lower.includes('invalid email')) {
      return 'El formato de correo no es válido.';
    }
    return err;
  };

  useEffect(() => {
    let isMounted = true;

    // Verificar sesión existente en AsyncStorage / Supabase
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!isMounted) return;
      setSession(currentSession);
      if (currentSession?.user) {
        setUser({
          id: currentSession.user.id,
          email: currentSession.user.email,
          username:
            currentSession.user.user_metadata?.username ||
            currentSession.user.email?.split('@')[0] ||
            'Invocador',
          isGuest: false,
        });
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!isMounted) return;
      setSession(currentSession);
      if (currentSession?.user) {
        setUser({
          id: currentSession.user.id,
          email: currentSession.user.email,
          username:
            currentSession.user.user_metadata?.username ||
            currentSession.user.email?.split('@')[0] ||
            'Invocador',
          isGuest: false,
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, pass: string): Promise<AuthResponse> => {
    if (!email.trim() || !pass.trim()) {
      return { success: false, error: 'Por favor ingresa tu correo y contraseña.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (error) {
        return { success: false, error: translateAuthError(error.message) };
      }

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          username: data.user.user_metadata?.username || email.split('@')[0],
          isGuest: false,
        });
        return { success: true };
      }

      return { success: false, error: 'No se pudo iniciar sesión.' };
    } catch (err: any) {
      return { success: false, error: translateAuthError(err.message || 'Error de conexión.') };
    }
  };

  const signUp = async (
    email: string,
    pass: string,
    username: string
  ): Promise<AuthResponse> => {
    if (!email.trim() || !pass.trim()) {
      return { success: false, error: 'Correo y contraseña son requeridos.' };
    }
    if (pass.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    const cleanUsername = username.trim() || email.split('@')[0];

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
        options: {
          data: {
            username: cleanUsername,
          },
        },
      });

      if (error) {
        return { success: false, error: translateAuthError(error.message) };
      }

      if (data.user) {
        // Si Supabase devuelve sesión activa, entrar inmediatamente
        if (data.session) {
          setUser({
            id: data.user.id,
            email: data.user.email,
            username: cleanUsername,
            isGuest: false,
          });
          return { success: true };
        }

        // Si mailer_autoconfirm está desactivado en Supabase, pide verificar el correo
        return {
          success: true,
          message:
            '¡Cuenta creada con éxito! Si Supabase tiene activada la confirmación por correo, revisa tu bandeja de entrada para verificar tu cuenta antes de iniciar sesión.',
        };
      }

      return { success: false, error: 'No se pudo completar el registro.' };
    } catch (err: any) {
      return { success: false, error: translateAuthError(err.message || 'Error en registro.') };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setUser(null);
    setSession(null);
  };

  const continueAsGuest = () => {
    setUser({
      id: 'guest_user',
      username: 'Invocador Invitado',
      isGuest: true,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signUp,
        signOut,
        continueAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
};
