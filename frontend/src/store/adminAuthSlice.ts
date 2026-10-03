import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { adminApi } from '../services/adminApi';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  status: string;
  role?: {
    id: string;
    name: string;
    description?: string;
  };
}

interface AdminAuthState {
  admin: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AdminAuthState = {
  admin: null,
  token: localStorage.getItem('adminToken'),
  isAuthenticated: !!localStorage.getItem('adminToken'),
  isLoading: false,
  error: null,
};

export const fetchCurrentAdmin = createAsyncThunk(
  'adminAuth/fetchCurrentAdmin',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApi.get('/auth/me');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to fetch admin profile'
      );
    }
  }
);

export const adminAuthSlice = createSlice({
  name: 'adminAuth',
  initialState,
  reducers: {
    setAdminCredentials: (
      state,
      action: PayloadAction<{ user: AdminUser; access_token: string }>
    ) => {
      state.admin = action.payload.user;
      state.token = action.payload.access_token;
      state.isAuthenticated = true;
      state.error = null;
      localStorage.setItem('adminToken', action.payload.access_token);
    },
    adminLogout: (state) => {
      state.admin = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('adminToken');
    },
    clearAdminError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentAdmin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.admin = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.admin = null;
        state.isAuthenticated = false;
        state.token = null;
        state.error = action.payload as string;
        localStorage.removeItem('adminToken');
      });
  },
});

export const { setAdminCredentials, adminLogout, clearAdminError } = adminAuthSlice.actions;

export default adminAuthSlice.reducer;
