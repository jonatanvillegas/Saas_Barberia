import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      usuario: null,
      barberia: null,

      login: async (email, password, slug) => {
        const { data } = await api.post('/auth/login', { email, password, slug });
        set({
          token: data.token,
          usuario: data.usuario,
          barberia: data.usuario.barberia,
        });
        return data;
      },

      logout: () => {
        set({ token: null, usuario: null, barberia: null });
      },

      refreshMe: async () => {
        const { data } = await api.get('/auth/me');
        set({ usuario: data.data, barberia: data.data.barberia });
      },

      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'barberia-auth',
      partialize: (state) => ({ token: state.token, usuario: state.usuario, barberia: state.barberia }),
    }
  )
);

export default useAuthStore;
