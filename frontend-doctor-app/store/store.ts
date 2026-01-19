import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { thunk } from 'redux-thunk';

// Example slice (you can create your own slices as needed)
import counterReducer from './counterSlice';
import authReducer from "./authSlice";
import patientReducer from "./patientSlice"
import notificationReducer from './notificationSlice';

const store = configureStore({
  reducer: {
    counter: counterReducer,
    auth: authReducer,
    patient: patientReducer,
    notification: notificationReducer
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(thunk),
  duplicateMiddlewareCheck: false,
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
