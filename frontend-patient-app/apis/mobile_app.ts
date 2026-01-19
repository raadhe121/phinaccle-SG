import { appVersion } from "@/Config";
import { get, onErrorCallback } from ".";

export async function checkUpdateApi(
    onError: onErrorCallback = () => {}
) {
    const resp = await get({
        url: `/api/mobile_app/update_check?version=${appVersion}`,
        onError
    });

    return resp;
}
