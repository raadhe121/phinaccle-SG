import React, { useEffect, useRef, useState } from 'react';
import KeyboardView from '@/common/components/KeyboardView';
import { BoldText, CNavHeader, CText, Height, MenuItem, MText, ReactQueryChild, Section } from '@/common/components/AntdText';
import { Toast, Button, View, Modal } from '@ant-design/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, getYuuStatusApiV1PatientYuuGet, getYuuWebpageApiV1PatientYuuWebpageGet, yuuLinkAccountApiV1PatientYuuLinkPost, yuuUnlinkAccountApiV1PatientYuuUnlinkPost } from '@/services/client';
import { Image } from 'expo-image';
import { colors } from '@/common/utils/config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import AntdMiniIcon from '@/common/components/AntdMiniIcon';
import { onError } from '@/common/utils/lib';
import { toast } from '@/common/utils/modal';

export default function YuuLinkScreen() {
  const { url } = useLocalSearchParams(); // for link redirect from browser. Test from separate phone
  const deepUrl = Linking.useURL(); // for deep link redirect from Yuu
  const insets = useSafeAreaInsets();
  const [ showSuccessModal, setShowSuccessModal ] = useState(false);

  // Require a redirect because the web page is still in the stack
  useEffect(() => {
    if (!deepUrl || deepUrl === url || !deepUrl?.includes('code=')) return;
    // router.dismissTo({ pathname: '/profile' })
    router.push({ pathname: '/profile/yuu', params: { url: deepUrl } })
  }, [deepUrl])

  const queryClient = useQueryClient();
  const qry = useQuery({
    queryKey: ['yuu-status'],
    queryFn: getYuuStatusApiV1PatientYuuGet
  })

  const preauthorizeMutation = useMutation({
    mutationFn: getYuuWebpageApiV1PatientYuuWebpageGet,
    onSuccess: async (data) => {
      router.navigate({ pathname: '/profile/yuu_web', params: { url: data.redirect_url } });
    },
    onError: onError
  });

  const toastRef = useRef<() => void>();
  const linkAccountMutation = useMutation({
    mutationFn: async ({ code, state }: { code: string; state: string }) => {
      return await yuuLinkAccountApiV1PatientYuuLinkPost({
        requestBody: { code, state }
      });
    },
    onMutate: () => toastRef.current = toast.loading(),
    onSuccess: (data) => {
      if (data.show_success_modal) {
        setShowSuccessModal(true)
      }
      queryClient.invalidateQueries({ queryKey: ['yuu-status'] });
      if (toastRef.current) toastRef.current();
    },
    onError: (error: ApiError) => {
      if (toastRef.current) toastRef.current();
      onError(error);
    }
  });

  const unlinkMutation = useMutation({
    mutationFn: yuuUnlinkAccountApiV1PatientYuuUnlinkPost,
    onSuccess: () => {
      Toast.success({
        content: 'yuu account unlinked',
        duration: 1,
      });
      queryClient.invalidateQueries({ queryKey: ['yuu-status'] });
    },
    onError: onError
  })

  // This will trigger when the user is redirected through Deep Link or In App Browser
  useEffect(() => {
    if (!url?.includes('code=')) return;
    const params = new URLSearchParams(url as string);
    const code = params.get('code') ?? '';
    const state = params.get('state') ?? '';
    linkAccountMutation.mutate({ code, state });
  }, [url])

  const action = (
    qry.data?.is_linked ? (
      <Button onPress={() => unlinkMutation.mutate()} type="warning" loading={unlinkMutation.isPending} disabled={unlinkMutation.isPending}>
        Unlink yuu account
      </Button>
    ) : (
      <Button onPress={() => preauthorizeMutation.mutate()} type="primary" loading={preauthorizeMutation.isPending} disabled={preauthorizeMutation.isPending}>
        Link yuu & Pinnacle accounts
      </Button>
    )
  )

  return (
    <KeyboardView
      header={<CNavHeader title='yuu Rewards Club' navBack={() => router.dismissTo({ pathname: '/profile' })} customHeader={{ uri: require('@/assets/images/yuu_header.png'), width: 393, height: 200 }} />}
      action={action}
    >
      <ReactQueryChild query={qry}>
        <Section title={<Height h={12} />}>
          {
            qry.data?.is_linked
              ? (
                <MenuItem icon={<Image source={require('@/common/assets/support/checkmark-icon.png')} style={{ width: 20, height: 20 }} />} arrow=''>
                  <View>
                    <CText size={17}>Your yuu account is linked</CText>
                    <CText size={13} style={{ color: colors.weak }}>Linked yuu ID: {qry.data?.tomo_id}</CText>
                  </View>
                </MenuItem>
              )
              : (
                <MenuItem icon={<AntdMiniIcon name="LinkOutline" size={20} />} arrow=''>
                  <CText size={17}>Link your yuu account and get <BoldText style={{ color: colors.primary }}>100 points</BoldText></CText>
                </MenuItem>
              )
          }
          <MenuItem icon={<Image source={require('@/assets/images/yuu_icon.png')} style={{ width: 20, height: 20 }} />} arrow=''>
            <CText size={17}><BoldText style={{ color: colors.primary }}>yuu member rates</BoldText> at Pinnacle Family Clinic</CText>
          </MenuItem>
          <MenuItem
            icon={<Image source={require('@/assets/images/yuu_earn_icon.png')}
            style={{ width: 20, height: 20, opacity: 0.3 }} />}
            arrow=''
            extra={<BoldText size={14} style={{ opacity: 0.3, color: colors.primary }}>Coming Soon</BoldText>}
          >
            <CText size={17} style={{ opacity: 0.3 }}>Earn & pay with yuu Points</CText>
          </MenuItem>
        </Section>
      </ReactQueryChild>
      {showSuccessModal && <Modal
        popup
        visible={showSuccessModal}
        animationType="slide-up"
        style={{ paddingBottom: 0, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
        onClose={() => setShowSuccessModal(false)}
        maskClosable={true}
      >
        <View style={{ alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <BoldText size={18}>Your yuu Account is now linked!</BoldText>
          <Image source={require('@/assets/images/yuu_link_success.png')} style={{ width: '100%', aspectRatio: 1.7, marginTop: 10 }} />
        </View>
        <View style={{ backgroundColor: colors.brands4, padding: 16 }}>
          <Button onPress={() => setShowSuccessModal(false)} type="primary">Okay, got it</Button>
          <Height h={insets.bottom + 12} />
        </View>
      </Modal>}
    </KeyboardView>
  );
}