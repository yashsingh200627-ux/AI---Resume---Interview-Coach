import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export type ThemeMode = 'light' | 'dark';
export type DarkAccent = 'emerald' | 'cyan' | 'violet' | 'amber';

interface UIState {
  toasts: Toast[];
  isCareerChatOpen: boolean;
  isDemoModalOpen: boolean;
  theme: ThemeMode;
  darkAccent: DarkAccent;
}

const getInitialTheme = (): ThemeMode => {
  const saved = localStorage.getItem('theme') as ThemeMode | null;
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  return 'dark'; // Default dark
};

const getInitialDarkAccent = (): DarkAccent => {
  const saved = localStorage.getItem('dark_accent') as DarkAccent | null;
  if (saved && ['emerald', 'cyan', 'violet', 'amber'].includes(saved)) {
    return saved;
  }
  return 'emerald'; // New Cyber Emerald & Mint/Teal color theme!
};

const initialTheme = getInitialTheme();
const initialDarkAccent = getInitialDarkAccent();

// Sync html element immediately on script load
if (typeof document !== 'undefined') {
  if (initialTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  document.documentElement.setAttribute('data-dark-accent', initialDarkAccent);
}

const initialState: UIState = {
  toasts: [],
  isCareerChatOpen: false,
  isDemoModalOpen: false,
  theme: initialTheme,
  darkAccent: initialDarkAccent,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    addToast: (state, action: PayloadAction<{ type: Toast['type']; message: string }>) => {
      const id = Math.random().toString(36).substring(2, 9);
      state.toasts.push({ id, ...action.payload });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    toggleCareerChat: (state) => {
      state.isCareerChatOpen = !state.isCareerChatOpen;
    },
    setCareerChatOpen: (state, action: PayloadAction<boolean>) => {
      state.isCareerChatOpen = action.payload;
    },
    setDemoModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isDemoModalOpen = action.payload;
    },
    toggleTheme: (state) => {
      const newTheme: ThemeMode = state.theme === 'dark' ? 'light' : 'dark';
      state.theme = newTheme;
      localStorage.setItem('theme', newTheme);
      if (typeof document !== 'undefined') {
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    },
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
      if (typeof document !== 'undefined') {
        if (action.payload === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    },
    setDarkAccent: (state, action: PayloadAction<DarkAccent>) => {
      state.darkAccent = action.payload;
      localStorage.setItem('dark_accent', action.payload);
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-dark-accent', action.payload);
      }
    },
  },
});

export const {
  addToast,
  removeToast,
  toggleCareerChat,
  setCareerChatOpen,
  setDemoModalOpen,
  toggleTheme,
  setTheme,
  setDarkAccent,
} = uiSlice.actions;

export default uiSlice.reducer;
