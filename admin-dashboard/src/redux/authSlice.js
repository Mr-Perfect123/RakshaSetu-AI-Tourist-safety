import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const loginUser = createAsyncThunk('auth/loginUser', async (credentials, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', credentials);
    // res will be the unwrapped payload because of the Axios interceptor
    const payload = res.data || res;
    const token = payload.accessToken || res.accessToken;
    const refreshToken = payload.refreshToken || res.refreshToken;
    const user = payload.user || res.user;

    if (token) {
      localStorage.setItem('rakshasetu_token', token);
    }
    if (refreshToken) {
      localStorage.setItem('rakshasetu_refresh_token', refreshToken);
    }
    if (user) {
      localStorage.setItem('rakshasetu_user', JSON.stringify(user));
    }
    return { user, accessToken: token, refreshToken };
  } catch (err) {
    return rejectWithValue(err.message || err.data?.message || 'Login failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: (() => {
      try {
        return JSON.parse(localStorage.getItem('rakshasetu_user') || 'null');
      } catch (e) {
        return null;
      }
    })(),
    token: localStorage.getItem('rakshasetu_token') || null,
    loading: false,
    error: null
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('rakshasetu_token');
      localStorage.removeItem('rakshasetu_refresh_token');
      localStorage.removeItem('rakshasetu_user');
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
