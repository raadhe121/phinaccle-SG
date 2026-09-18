import auth from '@react-native-firebase/auth';
import { post, onErrorCallback } from './index';
import { SGiMedICType } from '@/services/client';

export const idTypes: SGiMedICType[] = [
    'PINK IC',
    'BLUE IC/ENTRY PERMIT',
    'FIN NUMBER',
    'PASSPORT',
    // 'CPF ACCOUNT',
    // 'VISA',
    // 'VISIT PASS',
    // 'LONG TERM VISIT PASS PLUS',
    // 'MALAYSIAN IC',
    // 'OTHER IDENTIFICATION',
]

export const idLabel: { [key in SGiMedICType]: string } = {
    'PINK IC': 'NRIC No.',
    'BLUE IC/ENTRY PERMIT': 'NRIC No.',
    'FIN NUMBER': 'FIN No.',
    'PASSPORT': 'Passport No.',
}
export const idValidators: { [key in SGiMedICType]: RegExp } = {
    'PINK IC': /^[ST]\d{7}[A-Z]$/,
    'BLUE IC/ENTRY PERMIT': /^[ST]\d{7}[A-Z]$/,
    'FIN NUMBER': /^[FMG]\d{7}[A-Z]$/,
    'PASSPORT': /^[A-Z0-9]{6,9}$/
}


export async function loginApi(
    { idType, idNumber, mobileCode, mobileNumber }: { idType: SGiMedICType, idNumber: string; mobileCode: string; mobileNumber: string },
    onError: onErrorCallback
) {
    const response = await post({
        url: '/api/auth/login',
        body: { id_type: idType, id_number: idNumber, mobile_code: mobileCode, mobile_number: mobileNumber },
        onError
    });

    return response;
}


export async function resendOtpApi(
    { sessionId }: { sessionId: string },
    onError: onErrorCallback
) {
    const response = await post({
        url: '/api/auth/resend_otp', 
        body: { session_id: sessionId },
        onError
    });

    return response
}

export async function verifyOtpApi(
    { sessionId, otp }: { sessionId: string, otp: string },
    onError: onErrorCallback
) {
    const response = await post({
        url: '/api/auth/verify_otp', 
        body: { session_id: sessionId, otp },
        onError
    });

    return response;
}

type RegisterParams = {
    sessionId: string;
    name: string;
    dateOfBirth: string;
    nationality: string;
    language: string;
    gender: string;
    notificationsOptIn: boolean;
    marketingOptIn: boolean;
}

export async function registerUserApi(
    { sessionId, name, dateOfBirth, nationality, language, gender, notificationsOptIn, marketingOptIn }: RegisterParams,
    onError: onErrorCallback
) {
    const response = await post({
        url: '/api/auth/register',
        body: {
            "session_id": sessionId,
            "name": name,
            "date_of_birth": dateOfBirth,
            "nationality": nationality,
            "language": language,
            "gender": gender,
            "enable_notifications": notificationsOptIn,
            "marketing_opt_in": marketingOptIn
        },
        onError
    });

    return response;
}

export async function verifyDobApi(
    { sessionId, dateOfBirth }: { sessionId: string, dateOfBirth: string },
    onError: onErrorCallback
) {
    const response = await post({
        url: '/api/auth/verify_dob', 
        body: { session_id: sessionId, date_of_birth: dateOfBirth },
        onError
    });

    return response;
}

export async function loginUser(token: string) {
    try {
        const status = await auth().signInWithCustomToken(token)
        console.log(status);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}
