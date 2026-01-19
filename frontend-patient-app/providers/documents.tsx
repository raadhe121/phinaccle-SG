import { getItem, localStorageDocumentCodeKey, removeItem } from "@/common/utils/async_storage";
import { onError } from "@/common/utils/lib";
import { toast } from "@/common/utils/modal";
import { ApiError, validateCodeApiDocumentValidateCodePost } from "@/services/client";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";

type DocumentContextProps = {
    code?: string;
    setCode: (code: string) => void;
    loading: boolean;
    setLoading: (loading: boolean) => void;
}

export const DocumentContext = React.createContext<DocumentContextProps>({
    setCode: () => {},
    loading: true,
    setLoading: () => {},
});

// This hook can be used to access the user info.
export function useDocument() {
    const value = React.useContext(DocumentContext);
    if (process.env.NODE_ENV !== 'production' && !value) {
        throw new Error('useDocument must be wrapped in a <DocumentProvider />');
    }
    return value;
}

export function getDocumentAccessCode() {
    const { code } = useDocument();
    if (!code) {
        router.replace('/documents')
    }
    return { code: code ?? '' };
}


export function DocumentProvider({ children }: { children: React.ReactNode }) {
    const [ loading, setLoading ] = useState(true);
    const [ code, setCode ] = useState<string>();

    // This validates the code if it appears in the local storage
    const toastRef = useRef<() => void>();
    const validateMutation = useMutation({
        mutationFn: validateCodeApiDocumentValidateCodePost,
        onMutate: () => {
            toastRef.current = toast.loading();
        },
        onSuccess: async (data, vars) => {
            if (toastRef.current) toastRef.current();
            setCode(vars.requestBody.code);
            setLoading(false);  
        },
        onError: (error: ApiError) => {
            // Close the loading toast
            if (toastRef.current) toastRef.current();
            // If the code is invalid, redirect to the password screen
            if (error.status == 400) {
                removeItem(localStorageDocumentCodeKey);
            } else {
                onError(error);
            }
            setLoading(false);
        }
    })

    useEffect(() => {
        const validateCode = async () => {
            const data = await getItem(localStorageDocumentCodeKey);
            if (data) {
                validateMutation.mutate({ requestBody: { code: data.code } });
            } else {
                setLoading(false);
            }
        }
        validateCode();
    }, [])

    return (
        <DocumentContext.Provider
            value={{
                code, setCode, loading, setLoading
            }}>
            {children}
        </DocumentContext.Provider>
    );
}