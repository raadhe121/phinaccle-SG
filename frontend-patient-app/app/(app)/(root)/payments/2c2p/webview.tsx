import React from 'react';
import WebView from 'react-native-webview';
// @ts-ignore
import { PGWWebViewNavigation } from '@2c2p/pgw-sdk-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ApiError, getPaymentInquiryApi2C2pPaymentInquiryPost } from '@/services/client';
import { onError } from '@/common/utils/lib';
import { Height } from '@/common/components/AntdText';
import KeyboardView from '@/common/components/KeyboardView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { handleInquiryResp } from '@/hooks/use2C2PPayment';

export default function PGWWebViewScreen() {
    const { redirectUrl } = useLocalSearchParams();
    const insets = useSafeAreaInsets();

    const paymentInquiryMutation = useMutation({
        mutationFn: getPaymentInquiryApi2C2pPaymentInquiryPost,
        onSuccess: handleInquiryResp,
        onError: onError
    })

    // https://developer.2c2p.com/docs/sdk-handle-pgw-payment-authentication
    return (
        <KeyboardView wrapScroll={false}>
            <Height h={insets.top} />
            <WebView
                source={{ uri: redirectUrl as string }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                onNavigationStateChange={(event: any) => {
                    // Reference : https://developer.2c2p.com/docs/api-sdk-transaction-status-inquiry
                    // Do Transaction Status Inquiry API to confirm successful tokenization and close the WebView.
                    PGWWebViewNavigation.inquiry(event.url ?? '', async (paymentToken: string) => {
                        paymentInquiryMutation.mutate({ requestBody: { paymentToken } })
                    });
                }}
            />
        </KeyboardView>
    );
}
