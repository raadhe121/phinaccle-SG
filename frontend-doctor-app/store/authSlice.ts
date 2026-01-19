import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  accessToken?: string | null;
  userId: string | null;
}

const initialState: AuthState = {
  accessToken: undefined, // undefined to refer to as loading state to prevent login screen from flashing
  userId: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<any>) { 
      if (action.payload == null) {
        state.accessToken = null 
        state.userId = null 
      } else {
        state.accessToken = action.payload.access_token;
        state.userId = action.payload.user.id
      }
    },
  },
});

export const { setSession } = authSlice.actions;
export default authSlice.reducer;
