import React from 'react'
import { useStore, StoreApi, create } from 'zustand'
import { GetPriceBreakdownResp, ServiceGroup, ServiceItem } from '@/services/client'
import { SurveyForm } from '@/app/(app)/(root)/appointment/survey/components';

export interface ServiceGroupState extends ServiceGroup {
  items?: ServiceItem[];
}

export interface Branch {
  id: string;
  name: string;
}

export interface CorporateCode {
  code: string;
  organization: string;
  patientSurveyTemplate: string[] | null;
  corporateSurveyTemplate: SurveyForm | null;
  onlyPrimaryUser: boolean;
}

type OtherInfo = {
  id: string;
  name: string;
  mobileNumber: string;
}

export type Patient = {
  id: string;
  name: string;
}

export type LocationType = 'onsite' | 'clinic';

export type Location = {
  type: LocationType;
  id: string;
  name: string;
}

export const MAX_MONTHS_AHEAD = 2; // Maximum number of months users can look ahead
export const MAX_SERVICE_GROUPS = 2; // Maximum number of service groups
export const MAX_BOOKING_DURATION = 45; // Maximum duration of booking in minutes

interface AppointmentState {
  corporateCode: CorporateCode | null;
  serviceGroups: ServiceGroupState[] | null;
  patients: Patient[] | null;
  patientSurvey: Record<string, string> | null; // Maps patient ID to corporate type
  corporateSurvey: Record<string, Record<string, string | string[]>> | null; // Maps corporate ID to corporate type
  location: Location | null;
  startDateTime: string | null;
  others: OtherInfo[] | null;
  payment: GetPriceBreakdownResp | null;
  branchIds: string[] | null; // Filter for specific branch IDs
  setOthers: (others: OtherInfo[] | null) => void;
  setCorporateCode: (corporateCode: CorporateCode | null) => void;
  setServiceGroups: (indexStr: string, serviceGroup: ServiceGroupState) => void;
  resetServiceGroups: () => void;
  setPatients: (patients: Patient[] | null) => void;
  setPatientSurvey: (options: Record<string, string> | null) => void;
  setCorporateSurvey: (survey: Record<string, Record<string, string | string[]>>) => void;
  setLocation: (location: Location | null) => void;
  setStartDateTime: (startDateTime: string | null) => void;
  setPayment: (payment: GetPriceBreakdownResp | null) => void;
  setBranchIds: (branchIds: string[] | null) => void;
}

const AppointmentContext = React.createContext<StoreApi<AppointmentState> | null>(null);

export const AppointmentProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [store] = React.useState(() =>
    create<AppointmentState>((set) => ({
      corporateCode: null,
      patientSurvey: null,
      corporateSurvey: null,
      serviceGroups : null,
      patients: null,
      others: null,
      location: null,
      startDateTime: null,
      payment: null,
      branchIds: null,
      setOthers: (others: OtherInfo[] | null) => set({ others }),
      setCorporateCode: (corporateCode: CorporateCode | null) => set({ corporateCode, patientSurvey: null, corporateSurvey: null }),
      setPatientSurvey: (options: Record<string, string> | null) => set({ patientSurvey: options }),
      setCorporateSurvey: (survey: Record<string, Record<string, string | string[]>>) => set({ corporateSurvey: survey }),
      setServiceGroups: (indexStr: string, serviceGroup: ServiceGroupState) => {
        // Replace if index exists, otherwise append
        const serviceGroups = [...(store.getState().serviceGroups || [])];
        const index = parseInt(indexStr);

        if (index >= serviceGroups.length) {
          serviceGroups.push(serviceGroup);
        } else {
          serviceGroups[index] = serviceGroup;
        }

        set({ serviceGroups, patients: null, location: null, startDateTime: null });
      } ,
      resetServiceGroups: () => set({ serviceGroups: null, patients: null, patientSurvey: null, corporateSurvey: null, location: null, startDateTime: null }),
      setPatients: (patients: Patient[] | null) => set({ patients, location: null, startDateTime: null }),
      setLocation: (location: Location | null) => set({ location, startDateTime: null }),
      setStartDateTime: (startDateTime: string | null) => set({ startDateTime }),
      setPayment: (payment: GetPriceBreakdownResp | null) => set({ payment }),
      setBranchIds: (branchIds: string[] | null) => set({ branchIds }),
    }))
  )

  return (
    <AppointmentContext.Provider value={store}>
      {children}
    </AppointmentContext.Provider>
  )
}

export const useAppointmentStore = (selector: (state: AppointmentState) => AppointmentState = (state) => state): AppointmentState => {
  const store = React.useContext(AppointmentContext)
  if (!store) {
    throw new Error('Missing AppointmentProvider')
  }
  return useStore(store, selector)
}
