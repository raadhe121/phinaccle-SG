import { onError } from "@/common/utils/lib";
import { deeplinkCheckApiAppointmentV1DeeplinkGet } from "@/services/client";
import { useMutation } from "@tanstack/react-query";
import * as Linking from 'expo-linking';
import { router } from "expo-router";
import { useEffect } from "react";

export const useAppointmentDeeplink = () => {
  // sg.com.pinnaclefamilyclinic.test.pinnaclesgplus://appointment?referral=YUU
  const deepUrl = Linking.useURL(); 

  const redirectMutation = useMutation({
    mutationFn: deeplinkCheckApiAppointmentV1DeeplinkGet,
    onSuccess: (data) => {
      if (data.redirect_pathname) {
        router.push(data.redirect_pathname);
      }
    },
    onError: onError
  })

  useEffect(() => {
    if (!deepUrl || deepUrl?.indexOf('?') === -1) return;
    const params = new URLSearchParams(deepUrl.split('?')[1])
    const code = params.get('referral');
    if (code) {
      redirectMutation.mutate({ code });
    }
  }, [deepUrl])

  const params = new URLSearchParams(deepUrl?.split('?')?.[1])
  return params.get('referral')
}