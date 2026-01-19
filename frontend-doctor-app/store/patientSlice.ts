// patientSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { ITeleconsult } from "../screens/QueueScreen";
import { DOMAIN } from "../Config";
import { modal } from "../common/utils/modal";

interface PatientState {
  loading: boolean;
  patient: ITeleconsult | null;
  error: string | null;
  actionLoading: boolean;
  session: any;
  sessionNavigation: boolean;
  onGoingConsult: ITeleconsult | null;
  success: string | null;
  fetchLoading: boolean;
}

const initialState: PatientState = {
  loading: false,
  patient: null,
  error: null,
  actionLoading: false,
  session: null,
  sessionNavigation: false,
  onGoingConsult: null,
  success: null,
  fetchLoading: false,
};

export interface TeleconsultRequest {
  teleconsult_id: string 
}

console.log(DOMAIN)

export const fetchPatientFromServer = createAsyncThunk<
  ITeleconsult, // Return type of the payload creator
  { id: string; accessToken: string }, // First argument to the payload creator
  { rejectValue: string } // Type for rejectWithValue
>("patient/fetchPatient", async ({ id, accessToken }, thunkAPI) => {
  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    const response = await axios.get<ITeleconsult>(
      `${DOMAIN}/${id}`,
      { headers }
    );
    return response.data;
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      return thunkAPI.rejectWithValue(err.message);
    } else {
      return thunkAPI.rejectWithValue("An unexpected error occurred");
    }
  }
});

export const fetchOngoingConsult = createAsyncThunk<
  any, // Replace with actual session data type if known
  { accessToken: string },
  { rejectValue: string }
>(
  'patient/fetchOngoingConsult',
  async ({ accessToken }, thunkAPI) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      };
      const response = await axios.get(
        `${DOMAIN}/teleconsult`,
        { headers }
      );
      return response.data;
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        return thunkAPI.rejectWithValue(err.response?.data.detail || err.message);
      } else {
        return thunkAPI.rejectWithValue('An unexpected error occurred');
      }
    }
  }
);

export const createSession = createAsyncThunk<
  any, // Replace with actual session data type if known
  { teleconsult: TeleconsultRequest; accessToken: string },
  { rejectValue: string }
>(
  'patient/createSession',
  async ({ teleconsult, accessToken }, thunkAPI) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      };
      const response = await axios.post(
        `${DOMAIN}/start-session`,
        teleconsult,
        { headers }
      );

      console.log(response.data)

      return response.data;
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        modal.error({
          title: "Create Session Error",
          content: err.response?.data.detail || err.message,
          labels: ["Ok"],
          onCancel: () => { },
        })
        return thunkAPI.rejectWithValue(err.response?.data.detail || err.message);
      } else {
        modal.error({
          title: "Create Session Error",
          content: "An unexpected error occurred",
          labels: ["Ok"],
          onCancel: () => { },
        })
        return thunkAPI.rejectWithValue('An unexpected error occurred');
      }
    }
  }
);

export const resumeSession = createAsyncThunk<
  any, // Replace with actual session data type if known
  { teleconsult: TeleconsultRequest; accessToken: string },
  { rejectValue: string }
>(
  'patient/resumeSession',
  async ({ teleconsult, accessToken }, thunkAPI) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      };
      const response = await axios.post(
        `${DOMAIN}/resume-session`,
        teleconsult,
        { headers }
      );

      return response.data;
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        modal.error({
          title: "Resume Session Error",
          content: err.response?.data.detail || err.message,
          labels: ["Ok"],
          onCancel: () => { },
        })
        return thunkAPI.rejectWithValue(err.response?.data.detail || err.message);
      } else {
        modal.error({
          title: "Resume Session Error",
          content: "An unexpected error occurred",
          labels: ["Ok"],
          onCancel: () => { },
        })
        return thunkAPI.rejectWithValue('An unexpected error occurred');
      }
    }
  }
);

export const cancelSession = createAsyncThunk<
  any, // Replace with actual session data type if known
  { teleconsult: TeleconsultRequest ; accessToken: string },
  { rejectValue: string }
>(
  'patient/cancelSession',
  async ({ teleconsult, accessToken }, thunkAPI) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      };
      const response = await axios.post(
        `${DOMAIN}/cancel-session`,
        teleconsult,
        { headers }
      );
      return response.data;
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        modal.error({
          title: "Cancel Session Error",
          content: err.response?.data.detail,
          labels: ["Ok"],
          onCancel: () => { },
        })
        return thunkAPI.rejectWithValue(err.response?.data.detail || err.message);
      } else {
        return thunkAPI.rejectWithValue('An unexpected error occurred');
      }
    }
  }
);

export const endSession = createAsyncThunk<
  any, // Replace with actual session data type if known
  { teleconsult: TeleconsultRequest; accessToken: string },
  { rejectValue: string }
>(
  'patient/endSession',
  async ({ teleconsult, accessToken }, thunkAPI) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      };
      const response = await axios.post(
        `${DOMAIN}/end-session`,
        teleconsult,
        { headers }
      );
      return response.data;
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        return thunkAPI.rejectWithValue(err.response?.data.detail || err.message);
      } else {
        return thunkAPI.rejectWithValue('An unexpected error occurred');
      }
    }
  }
);

const patientSlice = createSlice({
  name: "patient",
  initialState,
  reducers: {
    resetSuccess: (state) => {
      state.success = null
    },
    fetchPatient: (state, action) => {
      state.patient = action.payload.patient
    },
    resetSessionNavigation: (state) => {
      state.sessionNavigation = false
    }
    
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPatientFromServer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPatientFromServer.fulfilled,
        (state, action: PayloadAction<ITeleconsult>) => {
          state.loading = false;
          state.patient = action.payload;
        }
      )
      .addCase(
        fetchPatientFromServer.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading = false;
          state.error = action.payload || null;
        }
      )
      .addCase(createSession.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createSession.fulfilled, (state, action: PayloadAction<any>) => {
        state.actionLoading = false;
        state.session = action.payload.zoom; // Store session data, currently action.payload is patient, update future
        state.patient = action.payload.patient;
        state.onGoingConsult = action.payload.patient;
        state.sessionNavigation = true;
      })
      .addCase(createSession.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.actionLoading = false;
        state.error = action.payload || null;
      })
      .addCase(resumeSession.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(resumeSession.fulfilled, (state, action: PayloadAction<any>) => {
        state.actionLoading = false;
        state.session = action.payload.zoom; // Store session data, currently action.payload is patient, update future
        state.sessionNavigation = true;
      })
      .addCase(resumeSession.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.actionLoading = false;
        state.error = action.payload || null;
      })
      .addCase(cancelSession.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(cancelSession.fulfilled, (state, action: PayloadAction<any>) => {
        state.actionLoading = false;
        state.session = action.payload; // Store session data, currently action.payload is patient, update future
        state.patient = action.payload;
        state.onGoingConsult = null;
        state.success = "Done"
      })
      .addCase(cancelSession.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.actionLoading = false;
        state.error = action.payload || null;
      })
      .addCase(endSession.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(endSession.fulfilled, (state, action: PayloadAction<any>) => {
        state.actionLoading = false;
        state.session = action.payload; // Store session data, currently action.payload is patient, update future
        state.patient = action.payload;
        state.onGoingConsult = null;
        state.success = "Consultation Ended"
      })
      .addCase(endSession.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.actionLoading = false;
        state.error = action.payload || null;
      })
      .addCase(fetchOngoingConsult.pending, (state) => {
        state.fetchLoading = true;
        state.error = null;
      })
      .addCase(fetchOngoingConsult.fulfilled, (state, action: PayloadAction<any>) => {
        state.fetchLoading = false;
        state.session = action.payload; // Store session data, currently action.payload is patient, update future
        state.onGoingConsult = action.payload;
      })
      .addCase(fetchOngoingConsult.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.fetchLoading = false;
        state.error = action.payload || null;
      });
  },
});

export const { resetSuccess, fetchPatient, resetSessionNavigation } = patientSlice.actions;

export default patientSlice.reducer;
