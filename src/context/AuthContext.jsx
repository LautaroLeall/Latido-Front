import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getMonogram } from '../lib/utils';

const AuthContext = createContext(null);

// `profiles` y `businesses` tienen 2 relaciones (business_id y owner_id).
// El hint !fk_profiles_business evita el error de ambigüedad de PostgREST.
const PROFILE_SELECT = 'id, role, full_name, business_id, business:businesses!fk_profiles_business(*, plan:plans(id, code, name, supports, price_monthly, currency, is_custom))';
// Sin el plan: respaldo para cuando la migración 007 todavía no se aplicó en la base
const PROFILE_SELECT_LEGACY = 'id, role, full_name, business_id, business:businesses!fk_profiles_business(*)';

/**
 * Ruta de inicio según el rol y el estado del perfil
 */
export function homePathFor(profile) {
  if (!profile) return '/login';
  if (profile.role === 'super_admin') return '/super';
  return '/admin';
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [recoveryMode, setRecoveryMode] = useState(false);

  const userId = session?.user?.id ?? null;

  // 1) Sesión: solo se guarda el estado. No se llama a Supabase dentro del callback
  //    (recomendación oficial: evita bloqueos del cliente de Auth).
  useEffect(() => {
    if (!supabase) return undefined;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
      if (event === 'SIGNED_OUT') setRecoveryMode(false);
      setSession(newSession);
      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2) Perfil: se carga cada vez que cambia el usuario
  const profileRef = useRef(null);
  useEffect(() => { profileRef.current = profile; }, [profile]);

  const loadProfile = useCallback(async (uid) => {
    if (!supabase || !uid) {
      setProfile(null);
      setProfileError(null);
      return null;
    }
    setProfileLoading(true);
    setProfileError(null);
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select(PROFILE_SELECT)
        .eq('id', uid)
        .maybeSingle();

      // PGRST200 = relación inexistente (migración 007 pendiente): reintentar sin el plan
      if (error && (error.code === 'PGRST200' || /relationship|plans/i.test(error.message || ''))) {
        ({ data, error } = await supabase
          .from('profiles')
          .select(PROFILE_SELECT_LEGACY)
          .eq('id', uid)
          .maybeSingle());
      }

      if (error) throw error;
      if (!data) throw new Error('No encontramos tu perfil de usuario.');
      setProfile(data);
      return data;
    } catch (err) {
      console.error('[LATIDO] Error cargando perfil:', err);
      // Si ya teníamos el perfil de este mismo usuario, lo conservamos (falló solo el refresco)
      if (profileRef.current?.id !== uid) {
        setProfile(null);
        setProfileError(err);
      }
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile(userId);
  }, [userId, loadProfile]);

  // ── Acciones ────────────────────────────────────────────────────────────────
  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const sendPasswordReset = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    setRecoveryMode(false);
  }, []);

  const refreshProfile = useCallback(() => loadProfile(userId), [loadProfile, userId]);

  const value = useMemo(() => ({
    configured: !!supabase,
    session,
    user: session?.user ?? null,
    profile,
    business: profile?.business ?? null,
    businessMonogram: getMonogram(profile?.business?.name),
    isAdmin: profile?.role === 'admin',
    isSuperAdmin: profile?.role === 'super_admin',
    // loading = todavía no sabemos si hay sesión, o el perfil del usuario actual no llegó.
    // Un refresco del perfil ya cargado NO cuenta como loading (no desmonta el panel).
    loading: !authReady || (!!userId && !profileError && profile?.id !== userId),
    profileError,
    recoveryMode,
    signIn,
    signOut,
    sendPasswordReset,
    updatePassword,
    refreshProfile
  }), [
    session, profile, authReady, userId, profileLoading, profileError, recoveryMode,
    signIn, signOut, sendPasswordReset, updatePassword, refreshProfile
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
