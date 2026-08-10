import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import sosReducer from './sosSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    sos: sosReducer
  }
});

export default store;
