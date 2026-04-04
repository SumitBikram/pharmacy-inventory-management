import { create } from 'zustand';
import { supabase } from '../../lib/supabase';

const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await get().fetchProfile(session.user.id);
        set({ user: session.user, profile, loading: false });
      } else {
        set({ user: null, profile: null, loading: false });
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await get().fetchProfile(session.user.id);
          set({ user: session.user, profile });
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null });
        }
      });

      return subscription;
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchProfile: async (userId) => {
    const { data, error } = await supabase.functions.invoke('users', {
      body: { action: 'fetchProfile', userId },
    });
    if (error) {
      console.error('Error fetching profile:', error.message);
      return null;
    }
    if (data?.error) {
      console.error('Error fetching profile:', data.error);
      return null;
    }
    return data;
  },

  login: async (email, password) => {
    set({ error: null });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ error: error.message });
      return false;
    }
    const profile = await get().fetchProfile(data.user.id);
    set({ user: data.user, profile });
    return true;
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, error: null });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
