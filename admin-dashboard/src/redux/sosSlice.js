import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchActiveSos = createAsyncThunk('sos/fetchActiveSos', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/sos/active');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to load active SOS alerts');
  }
});

const sosSlice = createSlice({
  name: 'sos',
  initialState: {
    activeSosList: [],
    loading: false,
    error: null,
    selectedSos: null
  },
  reducers: {
    addNewSosAlert: (state, action) => {
      state.activeSosList.unshift(action.payload);
    },
    updateSosItemStatus: (state, action) => {
      const { sosId, status } = action.payload;
      const index = state.activeSosList.findIndex((item) => item.id === sosId);
      if (index !== -1) {
        if (status === 'resolved' || status === 'cancelled') {
          state.activeSosList.splice(index, 1);
        } else {
          state.activeSosList[index].status = status;
        }
      }
    },
    setSelectedSos: (state, action) => {
      state.selectedSos = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveSos.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActiveSos.fulfilled, (state, action) => {
        state.loading = false;
        state.activeSosList = action.payload;
      })
      .addCase(fetchActiveSos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { addNewSosAlert, updateSosItemStatus, setSelectedSos } = sosSlice.actions;
export default sosSlice.reducer;
