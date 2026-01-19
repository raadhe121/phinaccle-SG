import { apiUrl, publicToken } from '@/Config';
import auth from '@react-native-firebase/auth';

type ErrorType = {
    code: string;
    title: string;
    message: string;
}

export type onErrorCallback = (status: number, msg: ErrorType) => void

export const getHeaders = async () => {
    const userOrFixedToken = (await auth().currentUser?.getIdToken()) ?? publicToken;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userOrFixedToken}`,
    }
}

export const get = async ({ url, body, onError }: { url: string, body?: object, onError: onErrorCallback }) => {
    try {
        let combinedUrl = `${apiUrl}${url}`;
        if (body) {
            // Converts the body object values to strings
            const strBody = JSON.parse(JSON.stringify(body, (k, v) => v && typeof v === 'object' ? v : '' + v));
            combinedUrl += '?' + new URLSearchParams(strBody);
        }

        const headers = await getHeaders();
        const response = await fetch(combinedUrl, {
            method: 'GET',
            headers,
        });
        if (response.status !== 200) {
            onError(response.status, await response.json());
            return;
        }
        return await response.json();
    } catch (error: any) {
        onError(500, error.toString());
    }
}

export const post = async ({ url, body, onError }: { url: string, body: object, onError: onErrorCallback }) => {
    try {
        const combinedUrl = `${apiUrl}${url}`;
        console.log(`POST ${combinedUrl} ${JSON.stringify(body)}`);
        const headers = await getHeaders();
        const response = await fetch(combinedUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
        
        if (response.status !== 200) {
            // console.log()
            // console.log(await response.text())
            onError(response.status, await response.json());
            return;
        }
        return await response.json();
    } catch (error: any) {
        onError(500, error.toString());
    }
}
