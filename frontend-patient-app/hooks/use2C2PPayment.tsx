import { useEffect } from "react";
import RTNPGW, { 
    APIResponseCode// @ts-ignore
} from '@2c2p/pgw-sdk-react-native';
import { paymentGateway2C2P } from '@/Config';
import { CreditCardFormValues } from "react-native-credit-card-input";
import { router, UnknownInputParams } from "expo-router";
import { getPaymentInquiryApi2C2pPaymentInquiryPost, getTokenizePaymentTokenApi2C2pTokenizeTokenGet, PaymentInquiryResp } from "@/services/client";
import { modal } from "@/common/utils/modal";

type RTNPGWRequest = {
    paymentToken: string;
    payment: {
        code: {
            channelCode: string;
        };
        data: {
            cardNo: string;
            expiryMonth: number;
            expiryYear: number;
            securityCode: string;
        };
    };
}

type RTNPGWResponse = {
    additionalInfo: {
        barcodeData: string;
        paymentExpiry: string;
        qrData: string;
        referenceNo: string;
    };
    channelCode: string;
    data: string;
    displayTemplate: string;
    expiryDescription: string;
    expiryTimer: number;
    fallbackData: string;
    invoiceNo: string;
    paymentToken: string;
    responseCode: string;
    responseDescription: string;
    type: string;
}


const proceedTransaction = async (transactionResultRequest: any): Promise<RTNPGWResponse> => {
    const response = await RTNPGW.proceedTransaction(JSON.stringify(transactionResultRequest))
    let transactionResultResponse: RTNPGWResponse = JSON.parse(response);
    return transactionResultResponse;
}

export const handleInquiryResp = async (resp: PaymentInquiryResp) => {
    if (resp.return_to_root) {
        router.dismissTo('/')
        router.navigate({ pathname: resp.redirect_pathname, params: resp.redirect_params as UnknownInputParams });
    } else {
        router.dismissTo({ pathname: resp.redirect_pathname, params: resp.redirect_params as UnknownInputParams })
    }
}

export const use2C2PHook = () => {
    useEffect(() => {
        const initialise = async () => {
            let pgwsdkParams = {
                'apiEnvironment': paymentGateway2C2P.apiEnvironment
            };

            RTNPGW.initialize(JSON.stringify(pgwsdkParams)).then((response: string) => {
                console.log("Init: Success")
            }).catch ((error: Error) => {
                console.error(`Init: ${error}`);
            });
        }

        initialise();
    }, []);
    
    const handleTransactionResponse = async (pgwTransResp: RTNPGWResponse) => {
        // Verification Required
        const redirectRespCodes: string[] = [
            APIResponseCode.transactionAuthenticateRedirect,
            APIResponseCode.transactionAuthenticateFullRedirect
        ]
        if(redirectRespCodes.includes(pgwTransResp.responseCode)) {
            router.push({ pathname: '/payments/2c2p/webview', params: { redirectUrl: pgwTransResp?.data } });
        // Completed
        } else if(pgwTransResp?.responseCode == APIResponseCode.transactionCompleted) {
            // Inquiry payment result by using invoice no.
            const resp = await getPaymentInquiryApi2C2pPaymentInquiryPost({ requestBody: { invoiceNo: pgwTransResp.invoiceNo } })
            handleInquiryResp(resp)

        // Error State
        } else {
            modal.error({
                title: 'Payment Error',
                content: `Please contact an administrator\n\nError: ${pgwTransResp.responseCode} - ${pgwTransResp.responseDescription}`,
                labels: ['Ok'],
                onCancel: () => {},
            })
        }
    }

    const makePayment = async ({ paymentToken, customerToken, cvc }: { paymentToken: string, customerToken: string, cvc: string }) => {
        // Handle Transaction beteen Client and 2C2P
        let transactionResultRequest = {
            'paymentToken': paymentToken,
            'payment': {
                'code': {
                    'channelCode': 'CC'
                },
                'data': {
                    'token': customerToken,
                    'securityCode': cvc
                }
            }
        };
        const pgwTransResp = await proceedTransaction(transactionResultRequest)
        console.log("PGW", pgwTransResp);

        // Handle Transaction Response
        handleTransactionResponse(pgwTransResp);
    }

    const tokenizeCard = async (values: CreditCardFormValues) => {
        try {
            // Get Payment Token from PinnacleSG+
            const tokenResp = await getTokenizePaymentTokenApi2C2pTokenizeTokenGet();
            const paymentToken = tokenResp.paymentToken;

            // Handle Transaction beteen Client and 2C2P
            const transactionResultRequest: RTNPGWRequest = {
                'paymentToken': paymentToken,
                'payment': {
                    'code': {
                        'channelCode': 'CC'
                    },
                    'data': {
                        'cardNo': values.number.replace(/ /g, ''),
                        'expiryMonth': parseInt(values.expiry.split('/')[0]),
                        'expiryYear': parseInt(`20${values.expiry.split('/')[1]}`),
                        'securityCode': values.cvc
                    }
                }
            };
            const pgwTransResp = await proceedTransaction(transactionResultRequest)
            console.log("PGW", pgwTransResp);

            handleTransactionResponse(pgwTransResp);
        } catch (error) {
            console.error(error);
        }
    }

    return { tokenizeCard, makePayment };
}