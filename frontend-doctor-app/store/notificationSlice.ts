import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import * as Notifications from 'expo-notifications';


interface NotificationState {
  pushToken: string;
}

const initialState: NotificationState = {
  pushToken: "",

};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setPushToken(state, action: PayloadAction<string>) {
      if (action.payload === "") {
        state.pushToken = "";
      } else {

        state.pushToken = action.payload;
      }
    },
  },
});

export const { setPushToken } = notificationSlice.actions;
export default notificationSlice.reducer;