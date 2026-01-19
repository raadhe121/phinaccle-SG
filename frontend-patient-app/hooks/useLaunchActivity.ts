import { onError } from "@/common/utils/lib";
import { modal, toast } from "@/common/utils/modal";
import { ApiError, getAllowedRouteApiActivityRouteGet, VisitType } from "@/services/client";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useRef } from "react";

export const useLaunchActivity = () => {
    const toastRef = useRef<() => void>();
    const allowedRouteMutation = useMutation({
        mutationFn: getAllowedRouteApiActivityRouteGet,
        onMutate: () => {
            toastRef.current = toast.loading();
        },
        onSuccess: ({ route, ongoing }) => {
            // Close the loading toast
            if (toastRef.current) toastRef.current();

            if (route) {
                router.navigate(route);
                return;
            }

            const ongoingMapping: { [key: string]: string } = {
                'teleconsult': 'Teleconsultation',
                'walkin': 'Queue Request',
                'activity': 'Activity',
            }
            modal.warn({
                title: `Ongoing ${ongoingMapping[ongoing ?? 'activity']}`,
                content: `You are currently in a ${ongoingMapping[ongoing ?? 'activity'].toLowerCase()}. Please end the current session before proceeding.`,
                labels: ["OK"],
                onCancel: () => {},
            });
        },
        onError: (error: ApiError) => {
            // Close the loading toast
            if (toastRef.current) toastRef.current();
            onError(error);
        }
    })
    
    const launchActivity = (visitType: VisitType) => allowedRouteMutation.mutate({ visitType });
    return { launchActivity }
}
