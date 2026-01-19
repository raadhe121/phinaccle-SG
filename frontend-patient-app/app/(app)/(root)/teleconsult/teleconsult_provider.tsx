import React, { useEffect, useState } from "react";
import { useFamilyHook } from "../family/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FamilyMember, getRateApiTeleconsultV2PrepaymentRatePost, GetRateApiTeleconsultV2PrepaymentRatePostResponse, PaymentMethod, routers__patient__teleconsult_family__PrepaymentRateResp } from "@/services/client";

export type FormProps = {
    collectionMethod?: 'delivery' | 'pickup';
    address?: string; // Note: address is tracked in rates
    branchId?: string; // Note: branchId is tracked in useLocalSearchParams
    allergyOption?: 'yes' | 'no';
    userAllergy?: string | null;
    allergies?: { [key: string]: string }
    tncChecked?: boolean;
}

type PatientInitialAllergiesProps = {
    userAllergy?: string | null
    allergies?: { [key: string]: unknown }
}

type TeleconsultContextProps = {
    includeUser: boolean,
    patients?: FamilyMember[],
    hasFamily: boolean,
    patientInitialAllergies?: PatientInitialAllergiesProps,
    branch?: { id: string, name: string }
    rates?: GetRateApiTeleconsultV2PrepaymentRatePostResponse,
    paymentMethod: PaymentMethod,
    formVals: FormProps,
    formErrors: { [key in keyof FormProps]: string },
    validCorpCode?: string,
    formSubmitted: boolean,
    setFormSubmitted: Function,
    setFormErrors: Function,
    setFormVals: Function,
    setValidCorpCode: Function,
    setFamily: Function,
    setBranch: Function,
    setPaymentMethod: Function,
    setAllergies: Function,
}

export const TeleconsultContext = React.createContext<TeleconsultContextProps>({
    includeUser: true,
    hasFamily: false,
    paymentMethod: 'paynow_stripe',
    formErrors: {},
    formVals: {},
    formSubmitted: false,
    setFormSubmitted: () => {},
    setFormErrors: () => {},
    setFormVals: () => {},
    setValidCorpCode: () => {},
    setFamily: () => {},
    setBranch: () => {},
    setPaymentMethod: () => {},
    setAllergies: () => {},
});

// This hook can be used to access the user info.
export function useTeleconsultProvider() {
    const value = React.useContext(TeleconsultContext);
    return value;
}

export function TeleconsultProvider(props: React.PropsWithChildren) {
    const queryClient = useQueryClient();

    const [ family, setFamily ] = useState<{ ids: string[], include_user: boolean }>();
    const [ branch, setBranch ] = useState<{ id: string, name: string }>();
    // This is what should be updated to
    const { patients, hasFamily } = useFamilyHook(family?.ids);
    const [ formErrors, setFormErrors ] = useState<{ [key in keyof FormProps]: string }>({});
    const [ formVals, setFormVals ] = useState<FormProps>({});
    const [ paymentMethod, setPaymentMethod ] = useState<PaymentMethod>('paynow_stripe');
    const [ formSubmitted, setFormSubmitted ] = useState<boolean>(false); 

    const [ patientInitialAllergies, setPatientInitialAllergies] = useState<PatientInitialAllergiesProps>();
    // Used for storing and validating corporate code
    const [ validCorpCode, setValidCorpCode ] = useState<string>();
    const ratesQry = useQuery({
        queryKey: ['rates'],
        queryFn: ({ queryKey }) => getRateApiTeleconsultV2PrepaymentRatePost({
            requestBody: {
                code: validCorpCode,//queryKey[1],
                family_ids: patients?.map((p) => p.id),
                include_user: family?.include_user ?? true
            }
        })
    })
    const [ firstLoad, setFirstLoad ] = useState<boolean>(true);
    // Invalid the query when rates changed
    useEffect(() => {
        queryClient.invalidateQueries({ queryKey: ['rates'] })
    }, [family, validCorpCode])

    // Set previous logged allergy when rates are fetched
    useEffect(() => {
        setPatientInitialAllergies({
            userAllergy: ratesQry?.data?.user_allergy,
            allergies: ratesQry?.data?.allergies
        });
    }, [ratesQry.data]);

    const rates = ratesQry.data;
    const setAllergies = (userAllergy: string | null, allergies: { [key: string]: string }, validated: boolean) => {
        setFormVals((val) => ({ ...val, userAllergy, allergies }));
        // Error to block button when validated is false
        setFormErrors((val) => ({ ...val, allergies: validated ? undefined : 'error' }));
    }
    return (
        <TeleconsultContext.Provider
            value={{
                includeUser: family?.include_user ?? true,
                patients,
                hasFamily,
                patientInitialAllergies,
                branch,
                rates,
                validCorpCode,
                paymentMethod,
                formVals,
                formErrors,
                formSubmitted,
                setFormSubmitted,
                setFormErrors,
                setFormVals,
                setValidCorpCode,
                setFamily,
                setBranch,
                setPaymentMethod,
                setAllergies,
            }}>
            {props.children}
        </TeleconsultContext.Provider>
    );
}